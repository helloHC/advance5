import List "mo:base/List";

module {
  public type Operations = {
    #create;
    #install;
    #start;
    #stop;
    #delete;
    #addRestriction;
    #removeRestriction;
  };

  public type Proposal = {
    proposalsID: Nat;
		proposer: Principal;
		wasmCode:  ?Blob;
    wasmCodeHash: [Nat8];
		operation: Operations;
		canisterID:  ?Principal;
		approvers: List.List<Principal>;
    refusers: List.List<Principal>;
    isApprover: Bool;
		done: Bool;
	};
}