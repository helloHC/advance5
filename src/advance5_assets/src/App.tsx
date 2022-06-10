import { useEffect, useRef, useState } from "react"

import { Actor, HttpAgent } from "@dfinity/agent"

import { advance5 } from "../../declarations/advance5"

import useAuth from "./useAuth"
import { Principal } from "@dfinity/principal"

import useTextFileReader from "./useFileReader"
import { Proposal } from "../../declarations/advance5/advance5.did"

import './app.css';

function isIncludesPrincipal(sourceArr: Array<Principal>, target: Principal): boolean {
  const arr: Array<string> = sourceArr.map(principal => {
    return principal.toString()
  })

  return arr.includes(target.toString())
}

function App() {
  const { authClient, authenticatedStatus, identity, principal, bridge, authLogin } = useAuth()

  const [foundation, setFoundation] = useState<Array<Principal>>([])
  const [proposals, setProposals] = useState<Array<Proposal>>([])
  const [allCanister, setAllCanister] = useState<Array<Principal>>([])
  const allCanisterRef = useRef(allCanister)
  const [restrictionCanister, setRestrictionCanister] = useState<Array<Principal>>([])
  const restrictionCanisterRef = useRef(restrictionCanister)
  const [isFoundationMember, setIsFoundationMember] = useState(false)
  const isFoundationMemberRef = useRef(isFoundationMember)

  async function getFoundation() {
    setFoundation(await advance5.getFoundation())
  }

  async function createCanister(e: any) {
    await advance5.testInstall([Principal.fromText('rkp4c-7iaaa-aaaaa-aaaca-cai')], [[...new Uint8Array(e.target?.result)]])
  }

  const handleFileReader = async (e: any, canisterID?: Principal) => {
    try {
      // 获取文件
      const file = e.target.files[0];
      // 实例化 FileReader对象
      const reader = new FileReader();
      reader.onload = function (e) {
        // 在onload函数中获取最后的内容
        // setFileContent(e.target.result as string);
        console.log(e.target?.result);
        // createCanister(e)
        proposeHandler(ProposeAction.INSTALL, canisterID, [...new Uint8Array(e.target?.result! as ArrayBuffer)])

      };
      // 调用readerAsText方法读取文本
      reader.readAsText(file);
    } catch (error) {
      console.log(error)
    }
  };

  enum ProposeAction {
    CREATE = 'create',
    INSTALL = 'install',
    START = 'start',
    STOP = 'stop',
    DELETE = 'delete',
    ADDRESTRICTION = 'addRestriction',
    REMOVERESTRICTION = 'removeRestriction',
  }

  async function proposeHandler(option: ProposeAction, canisterID?: Principal, wasmCode?: Array<number>) {
    try {
      if (!authenticatedStatus) return
      console.log(identity);

      // const bridge = Actor.createActor(idlFactory, { agent: new HttpAgent({ identity }), canisterId: advance5ID! })

      let operation: any = {}
      operation[option] = null

      let res = await bridge?.propose(operation, canisterID ? [canisterID] : [], wasmCode ? [wasmCode] : [])
      console.log(res);
      updateData()
    } catch (error) {
      console.log(error);

    }
  }

  async function getIsFoundationMember() {
    // const bridge = Actor.createActor(idlFactory, { agent: new HttpAgent({ identity }), canisterId: advance5ID! })
    if (!bridge) return
    isFoundationMemberRef.current = await bridge?.isFoundationMember() as boolean
    setIsFoundationMember(isFoundationMemberRef.current)
    const i = await bridge?.whoami()
    console.log(bridge);

    console.log(i);

    console.log((i as Principal).toString());

    console.log(isFoundationMemberRef.current);


  }

  useEffect(() => {
    console.log(isFoundationMemberRef.current);

  }, [isFoundationMember])

  async function getProposals() {
    setProposals(await advance5.getProposals())
  }

  async function getAllCanister() {
    setAllCanister(await advance5.getAllCanister())
  }

  async function getRestrictionCanister() {
    setRestrictionCanister(await advance5.getRestrictionCanister())
  }

  async function joinFoundation() {
    // const bridge = Actor.createActor(idlFactory, { agent: new HttpAgent({ identity }), canisterId: advance5ID! })
    if (!authenticatedStatus) return
    await bridge?.joinFoundation()

    updateData()
  }

  async function vote(proposalID: bigint, isApprove: boolean) {
    // const bridge = Actor.createActor(idlFactory, { agent: new HttpAgent({ identity }), canisterId: advance5ID! })
    if (!authenticatedStatus) return
    await bridge?.vote(proposalID, isApprove)

    updateData()
  }

  function updateData() {
    getFoundation()
    getProposals()
    getAllCanister()
    getRestrictionCanister()
    getIsFoundationMember()
  }

  useEffect(() => {
    updateData()
    // createCanister()
    // console.log(authenticatedStatus);
    // console.log(principal);
    // console.log(identity);
  }, [])

  useEffect(() => {
    updateData()
    // createCanister()
    // console.log(authenticatedStatus);
    // console.log(principal);
    // console.log(identity);
  }, [bridge])

  return (
    <>

      {
        authenticatedStatus ?
          <div className="wrap">
            <div className="content-wrap">
              <div className="main-tit">Hello,your principal is </div>
              <div>{principal}</div>
            </div>
            <div className="content-wrap">
              <div className="main-tit">Foundation members</div>
              <div>{isFoundationMemberRef.current}</div>
              {
                !isFoundationMember &&
                <button type="button" className="canister-item" onClick={joinFoundation}>Join</button>
              }
              {
                foundation.map(mem => {
                  return (
                    <div key={mem.toString()}>{mem.toString()}</div>
                  )
                })
              }
            </div>
            <div className="content-wrap">
              <div className="main-tit">Canister List</div>
              <button type="button" className="canister-item" onClick={() => proposeHandler(ProposeAction.CREATE)}>create Canister</button>
              <div className="canister-group">
                {
                  allCanister.map(canister => {
                    return (
                      <div key={canister.toString()} className="canister-item">
                        <div className="canister-row">
                          <div className="canister-row-tit">Canister ID:</div>
                          <div>{canister.toString()}</div>
                        </div>
                        <div className="canister-row">
                          <div className="canister-row-tit">Canister Type:</div>
                          <div>{isIncludesPrincipal(restrictionCanister, canister) ? 'restriction' : 'no restriction'}</div>
                        </div>
                        {
                          isFoundationMember &&
                          (isIncludesPrincipal(restrictionCanister, canister) ?
                            (
                              <div className="canister-row">
                                <div className="canister-row-tit">to propose:</div>
                                <div className="action-row">
                                  <input type="file" onChange={e => handleFileReader(e, canister)} />install code
                                  <button type="button" onClick={() => proposeHandler(ProposeAction.START, canister)}>start Canister</button>
                                  <button type="button" onClick={() => proposeHandler(ProposeAction.STOP, canister)}>stop Canister</button>
                                  <button type="button" onClick={() => proposeHandler(ProposeAction.DELETE, canister)}>delete Canister</button>
                                  <button type="button" onClick={() => proposeHandler(ProposeAction.REMOVERESTRICTION, canister)}>remove restriction</button>
                                </div>
                              </div>
                            ) :
                            (
                              <button type="button" onClick={() => proposeHandler(ProposeAction.ADDRESTRICTION, canister)}>add to restriction</button>
                            ))
                        }
                      </div>
                    )
                  })
                }
              </div>
            </div>
            <div className="content-wrap">
              <div className="main-tit">Proposal List</div>
              <div className="proposal-group">
                {
                  proposals.map(proposal => {
                    return (
                      <div key={`proposals${proposal.proposalsID}`} className="proposal-item">
                        <div className="row-group">
                          <div className="row-tit">ProposalID</div>
                          <div>{proposal.proposalsID.toString()}</div>
                        </div>
                        <div className="row-group">
                          <div className="row-tit">Proposer</div>
                          <div>{proposal.proposer.toText()}</div>
                        </div>
                        <div className="row-group">
                          <div className="row-tit">WasmCodeHash</div>
                          <div>{proposal.wasmCodeHash.toString()}</div>
                        </div>
                        <div className="row-group">
                          <div className="row-tit">OperationType</div>
                          <div>{Object.keys(proposal.operation)[0]}</div>
                        </div>
                        <div className="row-group">
                          <div className="row-tit">CanisterID</div>
                          <div>{proposal.canisterID.toString()}</div>
                        </div>
                        <div className="row-group">
                          <div className="row-tit">Approvers</div>
                          {proposal.approvers.map(approver => {
                            return (
                              <div>{approver.toString()}</div>
                            )
                          })}
                        </div>
                        <div className="row-group">
                          <div className="row-tit">Refusers</div>
                          {proposal.refusers.map(refuser => {
                            return (
                              <div>{refuser.toString()}</div>
                            )
                          })}
                        </div>
                        <div className="row-group">
                          <div className="row-tit">IsApprover</div>
                          <div>{proposal.isApprover ? 'true' : 'false'}</div>
                        </div>
                        <div className="row-group">
                          <div className="row-tit">Done</div>
                          <div>{proposal.done ? 'true' : 'false'}</div>
                        </div>
                        {
                          (!proposal.done && isFoundationMember) &&
                          <div className="vote-btn-row">
                            <button type="button" className="vote-btn" onClick={() => { vote(proposal.proposalsID, true) }}>approve</button>
                            <button type="button" className="vote-btn" onClick={() => { vote(proposal.proposalsID, false) }}>refuse</button>
                          </div>
                        }
                      </div>
                    )
                  })
                }
              </div>
            </div>
          </div> :
          <button type="button" onClick={authLogin}>登录</button>
      }
    </>
  )
}

export default App