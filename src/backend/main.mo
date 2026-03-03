import Array "mo:core/Array";
import Map "mo:core/Map";
import List "mo:core/List";
import Iter "mo:core/Iter";
import Time "mo:core/Time";
import Text "mo:core/Text";
import Order "mo:core/Order";
import Int "mo:core/Int";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";

actor {
  include MixinStorage();
  type FontFamily = {
    #arial;
    #verdana;
    #sansSerif;
    #openDyslexic;
  };

  type TaskStatus = {
    #pending;
    #inProgress;
    #done;
  };

  type TaskPriority = {
    #low;
    #medium;
    #high;
  };

  type Task = {
    id : Int;
    title : Text;
    description : Text;
    status : TaskStatus;
    priority : TaskPriority;
  };

  type StudySession = {
    subject : Text;
    durationMinutes : Nat;
    date : Time.Time;
  };

  module StudySession {
    public func compareByDate(session1 : StudySession, session2 : StudySession) : Order.Order {
      Int.compare(session1.date, session2.date);
    };
  };

  type UserProfile = {
    fontSize : Nat;
    fontFamily : FontFamily;
    letterSpacing : Nat;
    lineSpacing : Nat;
    highContrast : Bool;
  };

  type PdfMetadata = {
    name : Text;
    blobId : Text;
    sizeBytes : Nat;
    uploadedAt : Time.Time;
  };

  type PointsTransaction = {
    eventType : Text;
    points : Nat;
    timestamp : Time.Time;
  };

  type UserPoints = {
    balance : Nat;
    transactions : List.List<PointsTransaction>;
  };

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  let userProfiles = Map.empty<Principal, UserProfile>();
  let notes = Map.empty<Principal, List.List<Text>>();
  let tasks = Map.empty<Principal, List.List<Text>>();
  let studySessions = Map.empty<Principal, List.List<StudySession>>();
  let tips = List.empty<Text>();
  let glossary = Map.empty<Text, Text>();

  let pdfMetadataMap = Map.empty<Principal, List.List<PdfMetadata>>();
  let userPointsMap = Map.empty<Principal, UserPoints>();

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    switch (userProfiles.get(user)) {
      case (null) { Runtime.trap("User not found") };
      case (?profile) { ?profile };
    };
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  public shared ({ caller }) func addTip(tip : Text) : async () {
    tips.add(tip);
  };

  public query ({ caller }) func getTips() : async [Text] {
    tips.toArray();
  };

  public shared ({ caller }) func addGlossaryTerm(term : Text, definition : Text) : async () {
    glossary.add(term, definition);
  };

  public query ({ caller }) func getGlossary() : async [(Text, Text)] {
    glossary.entries().toArray();
  };

  public query ({ caller }) func searchGlossary(term : Text) : async ?Text {
    glossary.get(term);
  };

  public shared ({ caller }) func logStudySession(subject : Text, duration : Nat) : async () {
    let newSession : StudySession = {
      subject;
      durationMinutes = duration;
      date = Time.now();
    };

    let existingSessions = switch (studySessions.get(caller)) {
      case (null) { List.empty<StudySession>() };
      case (?sessions) { sessions };
    };

    existingSessions.add(newSession);
    studySessions.add(caller, existingSessions);
  };

  public query ({ caller }) func getStudySessions(user : Principal) : async [StudySession] {
    switch (studySessions.get(user)) {
      case (null) { [] };
      case (?sessions) {
        sessions.toArray().sort(StudySession.compareByDate);
      };
    };
  };

  // ---------- PDF Metadata ---------
  public shared ({ caller }) func addPdfMetadata(name : Text, blobId : Text, sizeBytes : Nat) : async () {
    let metadata : PdfMetadata = {
      name;
      blobId;
      sizeBytes;
      uploadedAt = Time.now();
    };

    let existingMetadata = switch (pdfMetadataMap.get(caller)) {
      case (null) { List.empty<PdfMetadata>() };
      case (?metadata) { metadata };
    };

    existingMetadata.add(metadata);
    pdfMetadataMap.add(caller, existingMetadata);
  };

  public query ({ caller }) func getUserPdfs() : async [PdfMetadata] {
    switch (pdfMetadataMap.get(caller)) {
      case (null) { [] };
      case (?metadata) { metadata.toArray() };
    };
  };

  public shared ({ caller }) func deletePdfMetadata(blobId : Text) : async () {
    switch (pdfMetadataMap.get(caller)) {
      case (null) {
        Runtime.trap("No PDF metadata found to delete");
      };
      case (?metadata) {
        let filtered = metadata.filter(func(meta) { meta.blobId != blobId });
        if (filtered.size() == metadata.size()) {
          Runtime.trap("PDF metadata with provided blobId not found");
        };
        pdfMetadataMap.add(caller, filtered);
      };
    };
  };

  // ------------ Points System -----------
  public shared ({ caller }) func addPoints(eventType : Text, points : Nat) : async () {
    let transaction : PointsTransaction = {
      eventType;
      points;
      timestamp = Time.now();
    };

    switch (userPointsMap.get(caller)) {
      case (null) {
        let transactions = List.singleton<PointsTransaction>(transaction);
        userPointsMap.add(caller, { balance = points; transactions });
      };
      case (?existing) {
        let newBalance = existing.balance + points;
        existing.transactions.add(transaction);
        userPointsMap.add(caller, { balance = newBalance; transactions = existing.transactions });
      };
    };
  };

  public query ({ caller }) func getUserPoints() : async Nat {
    switch (userPointsMap.get(caller)) {
      case (null) { 0 };
      case (?points) { points.balance };
    };
  };

  public query ({ caller }) func getPointsHistory() : async [PointsTransaction] {
    switch (userPointsMap.get(caller)) {
      case (null) { [] };
      case (?points) { points.transactions.toArray() };
    };
  };
};
