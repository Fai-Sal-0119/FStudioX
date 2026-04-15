import Map "mo:core/Map";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Order "mo:core/Order";
import Text "mo:core/Text";
import Error "mo:core/Error";

actor {

  // ─── Project Types ────────────────────────────────────────────────────────

  type Project = {
    title : Text;
    projectType : Text;
    content : Text;
    owner : Principal;
    createdAt : Time.Time;
    updatedAt : Time.Time;
  };

  module Project {
    public func compare(p1 : Project, p2 : Project) : Order.Order {
      Int.compare(p2.updatedAt, p1.updatedAt);
    };
  };

  // ─── AI Result Types (shared) ─────────────────────────────────────────────

  type AiImageResult = {
    #ok : { imageBase64 : Text; mimeType : Text };
    #err : Text;
  };

  type AiAudioResult = {
    #ok : { audioBase64 : Text; mimeType : Text; metadata : Text };
    #err : Text;
  };

  type AiDesignResult = {
    #ok : { suggestions : Text }; // JSON string: fonts, colors, text suggestions
    #err : Text;
  };

  // ─── IC Management Canister (HTTP Outcalls) ───────────────────────────────

  type HttpHeader = { name : Text; value : Text };
  type HttpMethod = { #get; #head; #post };
  type HttpRequestResult = { status : Nat; headers : [HttpHeader]; body : Blob };

  type TransformArg = {
    response : HttpRequestResult;
    context : Blob;
  };

  type HttpRequestArgs = {
    url : Text;
    max_response_bytes : ?Nat64;
    method : HttpMethod;
    headers : [HttpHeader];
    body : ?Blob;
    transform : ?{
      function : shared query TransformArg -> async HttpRequestResult;
      context : Blob;
    };
    is_replicated : ?Bool;
  };

  let ic : actor {
    http_request : HttpRequestArgs -> async HttpRequestResult;
  } = actor "aaaaa-aa";

  // ─── Project State ────────────────────────────────────────────────────────

  let projects = Map.empty<Nat, Project>();
  var nextProjectId = 0;

  // ─── Project CRUD ─────────────────────────────────────────────────────────

  public shared ({ caller }) func createProject(title : Text, projectType : Text, content : Text) : async Nat {
    let timestamp = Time.now();
    let id = nextProjectId;
    let project : Project = {
      title;
      projectType;
      content;
      owner = caller;
      createdAt = timestamp;
      updatedAt = timestamp;
    };
    projects.add(id, project);
    nextProjectId += 1;
    id;
  };

  public query ({ caller }) func getProjects() : async [Project] {
    projects.values().toArray().filter(
      func(p) { p.owner == caller }
    ).sort();
  };

  public query ({ caller }) func getProject(id : Nat) : async Project {
    switch (projects.get(id)) {
      case (null) { Runtime.trap("Project does not exist") };
      case (?project) {
        if (project.owner != caller) {
          Runtime.trap("Access denied");
        };
        project;
      };
    };
  };

  public shared ({ caller }) func updateProject(id : Nat, title : ?Text, content : ?Text) : async () {
    switch (projects.get(id)) {
      case (null) { Runtime.trap("Project does not exist") };
      case (?project) {
        if (project.owner != caller) {
          Runtime.trap("Access denied");
        };
        let updatedProject : Project = {
          project with
          title = switch (title) {
            case (null) { project.title };
            case (?t) { t };
          };
          content = switch (content) {
            case (null) { project.content };
            case (?c) { c };
          };
          updatedAt = Time.now();
        };
        projects.add(id, updatedProject);
      };
    };
  };

  public shared ({ caller }) func deleteProject(id : Nat) : async () {
    switch (projects.get(id)) {
      case (null) { Runtime.trap("Project does not exist") };
      case (?project) {
        if (project.owner != caller) {
          Runtime.trap("Access denied");
        };
        projects.remove(id);
      };
    };
  };

  // ─── AI Config ────────────────────────────────────────────────────────────

  // API key for Replicate.com — set via setAiApiKey by a controller.
  // If empty, endpoints return simulated/mock responses.
  var aiApiKey : Text = "";

  public shared ({ caller }) func setAiApiKey(key : Text) : async () {
    if (not caller.isController()) {
      Runtime.trap("Access denied: only controller may set API key");
    };
    aiApiKey := key;
  };

  // ─── AI Image Processing ──────────────────────────────────────────────────

  /// Process a base64-encoded image using an AI operation.
  /// operation: "colorize" | "cartoon" | "portrait_blur" | "object_remove" | "age_filter"
  /// Returns the processed image as base64 or a mock if no API key is set.
  public shared (_ctx) func processAiImage(imageBase64 : Text, operation : Text) : async AiImageResult {
    if (aiApiKey == "") {
      return #ok(buildMockImageResponse(imageBase64, operation));
    };

    let _modelId = imageOperationToModel(operation);
    let requestBody = buildReplicateImageRequest(imageBase64, operation);

    try {
      let bodyBlob = requestBody.encodeUtf8();
      let response = await ic.http_request({
        url = "https://api.replicate.com/v1/predictions";
        max_response_bytes = ?500_000;
        method = #post;
        headers = [
          { name = "Content-Type"; value = "application/json" },
          { name = "Authorization"; value = "Token " # aiApiKey },
        ];
        body = ?bodyBlob;
        transform = null;
        is_replicated = ?true;
      });

      if (response.status >= 200 and response.status < 300) {
        let bodyText = switch (response.body.decodeUtf8()) {
          case (?t) { t };
          case (null) { return #err("Failed to decode response body") };
        };
        // Extract output URL from Replicate response and return as metadata
        // Replicate is async; we return prediction ID so frontend can poll
        #ok({ imageBase64 = extractReplicateOutput(bodyText); mimeType = "image/png" });
      } else {
        let errorBody = switch (response.body.decodeUtf8()) {
          case (?t) { t };
          case (null) { "unknown error" };
        };
        #err("AI service error " # response.status.toText() # ": " # errorBody);
      };
    } catch (e) {
      #err("HTTP outcall failed: " # e.message());
    };
  };

  // ─── AI Audio Processing ──────────────────────────────────────────────────

  /// Process base64-encoded audio using an AI operation.
  /// operation: "vocals_separate" | "enhance_voice" | "normalize"
  /// Returns processed audio as base64 or a mock if no API key is set.
  public shared (_ctx) func processAiAudio(audioBase64 : Text, operation : Text) : async AiAudioResult {
    if (aiApiKey == "") {
      return #ok(buildMockAudioResponse(audioBase64, operation));
    };

    let requestBody = buildReplicateAudioRequest(audioBase64, operation);

    try {
      let bodyBlob = requestBody.encodeUtf8();
      let response = await ic.http_request({
        url = "https://api.replicate.com/v1/predictions";
        max_response_bytes = ?500_000;
        method = #post;
        headers = [
          { name = "Content-Type"; value = "application/json" },
          { name = "Authorization"; value = "Token " # aiApiKey },
        ];
        body = ?bodyBlob;
        transform = null;
        is_replicated = ?true;
      });

      if (response.status >= 200 and response.status < 300) {
        let bodyText = switch (response.body.decodeUtf8()) {
          case (?t) { t };
          case (null) { return #err("Failed to decode response body") };
        };
        #ok({
          audioBase64 = extractReplicateOutput(bodyText);
          mimeType = "audio/wav";
          metadata = bodyText;
        });
      } else {
        let errorBody = switch (response.body.decodeUtf8()) {
          case (?t) { t };
          case (null) { "unknown error" };
        };
        #err("AI service error " # response.status.toText() # ": " # errorBody);
      };
    } catch (e) {
      #err("HTTP outcall failed: " # e.message());
    };
  };

  // ─── AI Text / Design ─────────────────────────────────────────────────────

  /// Get AI-powered design suggestions: font matches, color palettes, text suggestions.
  /// Returns JSON string with suggestions array.
  public shared (_ctx) func processAiDesign(prompt : Text, designType : Text, brandColors : Text) : async AiDesignResult {
    if (aiApiKey == "") {
      return #ok({ suggestions = buildMockDesignSuggestions(prompt, designType, brandColors) });
    };

    let requestBody = "{\"model\":\"meta/llama-3-8b-instruct\",\"input\":{\"prompt\":\"You are a professional graphic designer. Respond ONLY with JSON (no markdown). Given a design request, return an object with keys: fonts (array of 3 font names), colors (array of 5 hex colors), textSuggestions (array of 3 text options). Design request: " # escapeJson(prompt) # ". Design type: " # escapeJson(designType) # ". Brand colors: " # escapeJson(brandColors) # "\"}}";

    try {
      let bodyBlob = requestBody.encodeUtf8();
      let response = await ic.http_request({
        url = "https://api.replicate.com/v1/predictions";
        max_response_bytes = ?100_000;
        method = #post;
        headers = [
          { name = "Content-Type"; value = "application/json" },
          { name = "Authorization"; value = "Token " # aiApiKey },
        ];
        body = ?bodyBlob;
        transform = null;
        is_replicated = ?true;
      });

      if (response.status >= 200 and response.status < 300) {
        let bodyText = switch (response.body.decodeUtf8()) {
          case (?t) { t };
          case (null) { return #err("Failed to decode response body") };
        };
        #ok({ suggestions = extractReplicateOutput(bodyText) });
      } else {
        let errorBody = switch (response.body.decodeUtf8()) {
          case (?t) { t };
          case (null) { "unknown error" };
        };
        #err("AI service error " # response.status.toText() # ": " # errorBody);
      };
    } catch (e) {
      #err("HTTP outcall failed: " # e.message());
    };
  };

  // ─── AI Prediction Status Poll ────────────────────────────────────────────

  /// Poll a Replicate prediction by ID to check if it has completed.
  /// Returns the raw JSON response from Replicate (status, output, error fields).
  public shared (_ctx) func getAiPredictionStatus(predictionId : Text) : async AiDesignResult {
    if (aiApiKey == "") {
      return #ok({ suggestions = "{\"status\":\"succeeded\",\"output\":\"mock-result\"}" });
    };

    try {
      let response = await ic.http_request({
        url = "https://api.replicate.com/v1/predictions/" # predictionId;
        max_response_bytes = ?100_000;
        method = #get;
        headers = [
          { name = "Authorization"; value = "Token " # aiApiKey },
        ];
        body = null;
        transform = null;
        is_replicated = ?true;
      });

      let bodyText = switch (response.body.decodeUtf8()) {
        case (?t) { t };
        case (null) { return #err("Failed to decode response body") };
      };

      if (response.status >= 200 and response.status < 300) {
        #ok({ suggestions = bodyText });
      } else {
        #err("AI service error " # response.status.toText() # ": " # bodyText);
      };
    } catch (e) {
      #err("HTTP outcall failed: " # e.message());
    };
  };

  // ─── Private Helpers ──────────────────────────────────────────────────────

  func imageOperationToModel(operation : Text) : Text {
    if (operation == "colorize") {
      "arielreplicate/deoldify-image:0da4c9f144ddf2f63"
    } else if (operation == "cartoon") {
      "catacolabs/cartoonify:f109015d-09c4"
    } else if (operation == "portrait_blur") {
      "cjwbw/background-removal:fb8af171-beca"
    } else if (operation == "object_remove") {
      "sanderland/inpainting:628d93b6"
    } else if (operation == "age_filter") {
      "yuval-alaluf/sam:9222a21c"
    } else {
      "stability-ai/stable-diffusion:db21e45d"
    };
  };

  func buildReplicateImageRequest(imageBase64 : Text, operation : Text) : Text {
    let model = imageOperationToModel(operation);
    "{\"version\":\"" # model # "\",\"input\":{\"image\":\"data:image/png;base64," # imageBase64 # "\"}}";
  };

  func buildReplicateAudioRequest(audioBase64 : Text, operation : Text) : Text {
    let model = if (operation == "vocals_separate") {
      "ryan5453/demucs:9cf82526"
    } else if (operation == "enhance_voice") {
      "adirik/resemble-enhance:8fd47a48"
    } else {
      "adirik/resemble-enhance:8fd47a48"
    };
    "{\"version\":\"" # model # "\",\"input\":{\"audio\":\"data:audio/wav;base64," # audioBase64 # "\",\"operation\":\"" # operation # "\"}}";
  };

  func extractReplicateOutput(responseJson : Text) : Text {
    // Extract prediction ID or output URL from Replicate JSON response.
    // We look for "id" field first (new prediction), then "output".
    // This is a simple text search since we have no JSON parser in core.
    let idMarker = "\"id\":\"";
    switch (findJsonStringValue(responseJson, idMarker)) {
      case (?value) { value };
      case (null) {
        switch (findJsonStringValue(responseJson, "\"output\":\"")) {
          case (?value) { value };
          case (null) { responseJson };
        };
      };
    };
  };

  func findJsonStringValue(text : Text, marker : Text) : ?Text {
    // Find marker in text, extract the string value that follows.
    let parts = text.split(#text(marker));
    var count = 0;
    var result : ?Text = null;
    for (part in parts) {
      if (count == 1) {
        // This part starts right after the marker — find closing quote
        let innerParts = part.split(#char '\"');
        var innerCount = 0;
        for (inner in innerParts) {
          if (innerCount == 0) {
            result := ?inner;
          };
          innerCount += 1;
        };
      };
      count += 1;
    };
    result;
  };

  func escapeJson(text : Text) : Text {
    text
      .replace(#char '\\', "\\\\")
      .replace(#char '\"', "\\\"")
      .replace(#char '\n', "\\n")
      .replace(#char '\r', "\\r");
  };

  // ─── Mock Responses (no API key) ─────────────────────────────────────────

  func buildMockImageResponse(imageBase64 : Text, _operation : Text) : { imageBase64 : Text; mimeType : Text } {
    // Return the original image unchanged — frontend can show it as a preview.
    // In production with a real API key, this would be the AI-processed version.
    {
      imageBase64 = imageBase64;
      mimeType = "image/png";
    };
  };

  func buildMockAudioResponse(audioBase64 : Text, operation : Text) : { audioBase64 : Text; mimeType : Text; metadata : Text } {
    {
      audioBase64 = audioBase64;
      mimeType = "audio/wav";
      metadata = "{\"operation\":\"" # operation # "\",\"status\":\"mock\",\"note\":\"Set AI API key to enable real processing\"}";
    };
  };

  func buildMockDesignSuggestions(prompt : Text, _designType : Text, _brandColors : Text) : Text {
    // Return structured mock suggestions so the frontend AI UI is fully functional.
    "{\"fonts\":[\"Poppins\",\"Montserrat\",\"Roboto\"],\"colors\":[\"#FF0000\",\"#FFFFFF\",\"#000000\",\"#FF4444\",\"#1A1A1A\"],\"textSuggestions\":[\"" # escapeJson(prompt) # "\",\"Creative Studio\",\"Express Yourself\"]}";
  };
};
