export const idlFactory = ({ IDL }) => {
  const List = IDL.Rec();
  const Operations = IDL.Variant({
    'stop' : IDL.Null,
    'addRestriction' : IDL.Null,
    'delete' : IDL.Null,
    'removeRestriction' : IDL.Null,
    'create' : IDL.Null,
    'start' : IDL.Null,
    'install' : IDL.Null,
  });
  List.fill(IDL.Opt(IDL.Tuple(IDL.Principal, List)));
  const Proposal = IDL.Record({
    'isApprover' : IDL.Bool,
    'wasmCode' : IDL.Opt(IDL.Vec(IDL.Nat8)),
    'done' : IDL.Bool,
    'refusers' : List,
    'operation' : Operations,
    'proposalsID' : IDL.Nat,
    'proposer' : IDL.Principal,
    'wasmCodeHash' : IDL.Vec(IDL.Nat8),
    'approvers' : List,
    'canisterID' : IDL.Opt(IDL.Principal),
  });
  const Wallet_center = IDL.Service({
    'execution' : IDL.Func(
        [Operations, IDL.Opt(IDL.Principal), IDL.Opt(IDL.Vec(IDL.Nat8))],
        [],
        [],
      ),
    'getAllCanister' : IDL.Func([], [IDL.Vec(IDL.Principal)], ['query']),
    'getFoundation' : IDL.Func([], [IDL.Vec(IDL.Principal)], ['query']),
    'getProposals' : IDL.Func([], [IDL.Vec(Proposal)], ['query']),
    'getRestrictionCanister' : IDL.Func(
        [],
        [IDL.Vec(IDL.Principal)],
        ['query'],
      ),
    'isFoundationMember' : IDL.Func([], [IDL.Bool], ['query']),
    'joinFoundation' : IDL.Func([], [], []),
    'propose' : IDL.Func(
        [Operations, IDL.Opt(IDL.Principal), IDL.Opt(IDL.Vec(IDL.Nat8))],
        [],
        [],
      ),
    'testInstall' : IDL.Func(
        [IDL.Opt(IDL.Principal), IDL.Opt(IDL.Vec(IDL.Nat8))],
        [],
        [],
      ),
    'vote' : IDL.Func([IDL.Nat, IDL.Bool], [], []),
    'whoami' : IDL.Func([], [IDL.Principal], ['query']),
  });
  return Wallet_center;
};
export const init = ({ IDL }) => {
  return [IDL.Nat, IDL.Nat, IDL.Vec(IDL.Principal)];
};
