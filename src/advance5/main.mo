import Principal "mo:base/Principal";
import Trie "mo:base/Trie";
import TrieSet "mo:base/TrieSet";
import Iter "mo:base/Iter";
import Option "mo:base/Option";
import Buffer "mo:base/Buffer";
import Hash "mo:base/Hash";
import Nat "mo:base/Nat";
import List "mo:base/List";
import Cycles "mo:base/ExperimentalCycles";
import Blob "mo:base/Blob";

import SHA256 "mo:sha256/SHA256";

import IC "./ic";

import Types "./types";

actor class Wallet_center (_threshold: Nat, _total: Nat, members: [Principal]) = self {
    stable var foundationSet : TrieSet.Set<Principal> = TrieSet.fromArray<Principal>(members, Principal.hash, Principal.equal);
    stable var canisterSet : TrieSet.Set<Principal> = TrieSet.empty<Principal>();
    stable var canisterRestrictionSet : TrieSet.Set<Principal> = TrieSet.empty<Principal>();
    stable var proposals : Trie.Trie<Nat, Types.Proposal> = Trie.empty<Nat, Types.Proposal>();
    stable var proposalsID : Nat = 0;
    stable var threshold : Nat = _threshold;
    stable var total : Nat = _total;

    func isMember(user: Principal) : Bool {
        TrieSet.mem(foundationSet, user, Principal.hash(user), Principal.equal)
    };

    func hasCanister(wrap: TrieSet.Set<Principal>, canister: ?Principal) : Bool {
        switch(canister) {
            case(?canister) {
                return TrieSet.mem(wrap, canister, Principal.hash(canister), Principal.equal);
            };
            case(null) {
                return false;
            };
        };
    };

    func hasApprover(num: Nat) : Bool {
        if(num >= threshold) {
            true
        } else {
            false
        }
    };

    func hasDone(approveCount: Nat, refuseCount: Nat) : Bool {
        assert(total > refuseCount and total > approveCount);
        if(approveCount >= threshold or approveCount + refuseCount == total or total - refuseCount < threshold) {
            true
        } else {
            false
        }
    };

    public shared ({caller}) func testInstall(canisterID: ?Principal, wasmCode: ?Blob) : async () {
        var wasmCodeHash : [Nat8] = [];
        wasmCodeHash := SHA256.sha256(Blob.toArray(Option.unwrap(wasmCode)));
        pushPropose(caller, #install, canisterID, wasmCode, wasmCodeHash);
        // let ic : IC.Self = actor("aaaaa-aa");
        // await ic.install_code({
        //             arg = [];
        //             wasm_module = Blob.toArray(wasmCode);
        //             mode = #install;
        //             canister_id = canisterID;
        //         });
    };

    public shared ({caller}) func joinFoundation() : async () {
        foundationSet := TrieSet.put(foundationSet, caller, Principal.hash(caller), Principal.equal);
    };

    public shared ({caller}) func execution(operation: Types.Operations, canisterID: ?Principal, wasmCode: ?Blob) : async () {
        if(hasCanister(canisterRestrictionSet, canisterID)) {
            await propose(operation, canisterID, wasmCode);
        } else {
            await doActions(operation, canisterID, wasmCode);
        }
    };

    //添加提案
    public shared ({ caller }) func propose(operation: Types.Operations, canisterID: ?Principal, wasmCode: ?Blob) : async () {
        assert(isMember(caller));

        var wasmCodeHash : [Nat8] = [];

        switch(operation) {
            case(#addRestriction) {
                assert(not hasCanister(canisterRestrictionSet, canisterID));
                pushPropose(caller, operation, canisterID, wasmCode, wasmCodeHash);
            };
            case(#install) {
                assert(hasCanister(canisterRestrictionSet, canisterID));
                wasmCodeHash := SHA256.sha256(Blob.toArray(Option.unwrap(wasmCode)));
                pushPropose(caller, operation, canisterID, wasmCode, wasmCodeHash);
            };
            case(#create) {
                pushPropose(caller, operation, canisterID, wasmCode, wasmCodeHash);
            };
            case(_) {
                assert(hasCanister(canisterRestrictionSet, canisterID));
                pushPropose(caller, operation, canisterID, wasmCode, wasmCodeHash);
            };
        };
    };

    func pushPropose(caller: Principal, operation: Types.Operations, _canisterID: ?Principal, _wasmCode: ?Blob, _wasmCodeHash: [Nat8]) {
        proposalsID += 1;
        proposals := Trie.put(proposals, { hash = Hash.hash(proposalsID); key = proposalsID}, Nat.equal, {
            proposalsID = proposalsID;
            proposer = caller;
            wasmCode = _wasmCode;
            wasmCodeHash = _wasmCodeHash;
            operation = operation;
            canisterID = _canisterID;
            approvers = List.nil<Principal>();
            refusers = List.nil<Principal>();
            isApprover = false;
            done = false;
        }).0;
    };

    //表决提案
    public shared ({ caller }) func vote(proposalsID: Nat, isApprove: Bool) : async () {
        switch (Trie.get(proposals, { hash = Hash.hash(proposalsID); key = proposalsID }, Nat.equal)) {
            case(?_proposal) {
                var _approvers : List.List<Principal> = List.nil();
                var _refusers : List.List<Principal> = List.nil();
                if(isApprove) {
                    _approvers := List.push(caller, _proposal.approvers);
                    _refusers := _proposal.refusers;
                } else {
                    _approvers := _proposal.approvers;
                    _refusers := List.push(caller, _proposal.refusers);
                };
                let suggestion = {
                    proposalsID = _proposal.proposalsID;
                    proposer = _proposal.proposer;
                    wasmCode = _proposal.wasmCode;
                    wasmCodeHash = _proposal.wasmCodeHash;
                    operation = _proposal.operation;
                    canisterID = _proposal.canisterID;
                    approvers = _approvers;
                    refusers = _refusers;
                    isApprover = hasApprover(List.size(_approvers));
                    done = hasDone(List.size(_approvers), List.size(_refusers));
                };
                proposals := Trie.replace(proposals, { hash = Hash.hash(proposalsID); key = proposalsID }, Nat.equal, ?suggestion).0;
                if(hasApprover(List.size(_approvers))) {
                    await operate(suggestion);
                }
            };
            case(_) {
                
            };
        };
    };

    //执行提案
    func operate(proposal: Types.Proposal) : async () {
        await doActions(proposal.operation, proposal.canisterID, proposal.wasmCode);
    };

    func doActions(operation: Types.Operations, canisterID: ?Principal, wasmCode: ?Blob) : async () {
        let ic : IC.Self = actor("aaaaa-aa");
        switch(operation) {
            case (#create) {
                Cycles.add(100_000_000_000);
                let canister_settings = {
                    freezing_threshold = null;
                    controllers = ?[Principal.fromActor(self)];
                    memory_allocation = null;
                    compute_allocation = null;
                };
                let result = await ic.create_canister({ settings = ?canister_settings });
                canisterSet := TrieSet.put(canisterSet, result.canister_id, Principal.hash(result.canister_id), Principal.equal);
            };
            case (#install) {
                await ic.install_code({
                    arg = [];
                    wasm_module = Blob.toArray(Option.unwrap(wasmCode));
                    mode = #install;
                    canister_id = Option.unwrap(canisterID);
                });
            };
            case (#start) {
                await ic.start_canister({
                    canister_id = Option.unwrap(canisterID);
                });
            };
            case (#stop) {
                await ic.stop_canister({
                    canister_id = Option.unwrap(canisterID);
                });
            };
            case (#delete) {
                await ic.delete_canister({
                    canister_id = Option.unwrap(canisterID);
                });
            };
            case (#addRestriction) {
                canisterRestrictionSet := TrieSet.put(canisterRestrictionSet, Option.unwrap(canisterID), Principal.hash(Option.unwrap(canisterID)), Principal.equal);
            };
            case (#removeRestriction) {
                canisterRestrictionSet := TrieSet.delete(canisterRestrictionSet, Option.unwrap(canisterID), Principal.hash(Option.unwrap(canisterID)), Principal.equal);
            };
        };
    };

    public query func getProposals () : async [Types.Proposal] {
        Trie.toArray<Nat, Types.Proposal, Types.Proposal>(proposals, func (key, value) : Types.Proposal {return value})
    };

    public query func getFoundation () : async [Principal] {
        TrieSet.toArray(foundationSet)
    };
    
    public query func getAllCanister () : async [Principal] {
        TrieSet.toArray(canisterSet)
    };
    
    public query func getRestrictionCanister () : async [Principal] {
        TrieSet.toArray(canisterRestrictionSet)
    };

    public query ({ caller }) func isFoundationMember() : async Bool {
        isMember(caller)
    };

    public query ({ caller }) func whoami() : async Principal {
        caller
    };
};