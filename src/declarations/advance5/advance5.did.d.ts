import type { Principal } from '@dfinity/principal';
export type List = [] | [[Principal, List]];
export type Operations = { 'stop' : null } |
  { 'addRestriction' : null } |
  { 'delete' : null } |
  { 'removeRestriction' : null } |
  { 'create' : null } |
  { 'start' : null } |
  { 'install' : null };
export interface Proposal {
  'isApprover' : boolean,
  'wasmCode' : [] | [Array<number>],
  'done' : boolean,
  'refusers' : List,
  'operation' : Operations,
  'proposalsID' : bigint,
  'proposer' : Principal,
  'wasmCodeHash' : Array<number>,
  'approvers' : List,
  'canisterID' : [] | [Principal],
}
export interface Wallet_center {
  'execution' : (
      arg_0: Operations,
      arg_1: [] | [Principal],
      arg_2: [] | [Array<number>],
    ) => Promise<undefined>,
  'getAllCanister' : () => Promise<Array<Principal>>,
  'getFoundation' : () => Promise<Array<Principal>>,
  'getProposals' : () => Promise<Array<Proposal>>,
  'getRestrictionCanister' : () => Promise<Array<Principal>>,
  'isFoundationMember' : () => Promise<boolean>,
  'joinFoundation' : () => Promise<undefined>,
  'propose' : (
      arg_0: Operations,
      arg_1: [] | [Principal],
      arg_2: [] | [Array<number>],
    ) => Promise<undefined>,
  'testInstall' : (
      arg_0: [] | [Principal],
      arg_1: [] | [Array<number>],
    ) => Promise<undefined>,
  'vote' : (arg_0: bigint, arg_1: boolean) => Promise<undefined>,
  'whoami' : () => Promise<Principal>,
}
export interface _SERVICE extends Wallet_center {}
