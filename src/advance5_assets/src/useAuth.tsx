import { Actor, ActorMethod, ActorSubclass, HttpAgent, Identity } from "@dfinity/agent"
import { AuthClient } from "@dfinity/auth-client"
import { useEffect, useRef, useState } from "react"
import { idlFactory, canisterId as canisterID } from "../../declarations/advance5"

function useAuth() {
  const [authClient, setAuthClient] = useState<AuthClient>()
  const [authenticatedStatus, setAuthenticatedStatus] = useState<boolean>()
  const [identity, setIdentity] = useState<Identity>()
  const [principal, setPrincipal] = useState<string | undefined>('')
  const [agent, setAgent] = useState<HttpAgent>()
  const [bridge, setBridge] = useState<ActorSubclass<Record<string, ActorMethod<unknown[], unknown>>>>()

  const authClientRef = useRef(authClient)
  const authenticatedStatusRef = useRef(authenticatedStatus)
  const identityRef = useRef(identity)
  const agentRef = useRef(agent)
  // const bridgeRef = useRef(bridge)

  async function makeBridge() {
    // bridgeRef.current = Actor.createActor(idlFactory, { agent: new HttpAgent({ identity }), canisterId: advance5ID! })
    // console.log(bridgeRef.current);
    console.log(agentRef.current);

    setBridge(Actor.createActor(idlFactory, { agent: agentRef.current, canisterId: canisterID! }))
  }

  async function getIdentity(authClient: AuthClient) {
    identityRef.current = await authClient.getIdentity()
    setIdentity(identityRef.current)
    console.log(identityRef.current);
    agentRef.current = new HttpAgent({ identity: identityRef.current })
    setAgent(agentRef.current)
    setBridge(Actor.createActor(idlFactory, { agent: agentRef.current, canisterId: canisterID! }))
  }

  useEffect(() => {
    (async () => {
      authClientRef.current = await AuthClient.create()
      setAuthClient(authClientRef.current)

      authenticatedStatusRef.current = await authClientRef.current.isAuthenticated()
      setAuthenticatedStatus(authenticatedStatusRef.current)

      if (authenticatedStatusRef.current && !identity) {
        getIdentity(authClientRef.current)
        // makeBridge()
      }
    })()
  }, [])

  useEffect(() => {
    setPrincipal(identity?.getPrincipal().toText())
  }, [identity])

  async function authLogin() {
    if (!authClient) {
      console.log('no client');

      return
    }
    await authClient?.login({
      identityProvider: process.env.NODE_ENV === "development" ? "http://rwlgt-iiaaa-aaaaa-aaaaa-cai.localhost:8000/" : "https://identity.ic0.app/",
      onSuccess: async () => {
        console.log('login success');

        console.log(authClient);
        authenticatedStatusRef.current = await authClient.isAuthenticated()
        setAuthenticatedStatus(authenticatedStatusRef.current)
        getIdentity(authClient)
        // makeBridge()
      }
    })
  }

  return {
    authClient,
    authenticatedStatus,
    identity,
    principal,
    bridge,
    authLogin,
  }
}

export default useAuth