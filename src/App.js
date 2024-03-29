import React from "react";
import { useState, useEffect } from "react";
import './App.css';
import { ethers } from "ethers";
import chatABI from './chatABI.json';
import PNS_ABI from "./PNS.json";

import ethLogo from './imgs/ethLogo.png';
import aaveLogo from './imgs/aaveLogo.png';
import uniswapLogo from './imgs/uniswapLogo.png';
import gmnLogo from './imgs/gmnGif.gif';
import bpLogo from './imgs/bpLogo.png';
import blgLogo from './imgs/blg.png';
import boeLogo from './imgs/boeLogo.png';
import mandalorLogo from './imgs/mandalorLogo.png';
import etherQuest from './imgs/etherquest_logo.png'

const CHAT_CONTRACT_ADDRESS = "0x85ecbF67C84171E87E78c1e6E77FF1288aeD3D49";
const PNS_ADDRESS = "0xF0Ff09E226503Ec632e8C59184E2593cB051Bd3b";

function App() {

  const [connected, setConnected] = useState(false);
  const [chatContract, setChatContract] = useState(null);
  const [renderedMessages, setRenderedMessages] = useState([]);

  const [showChat, setShowChat] = useState(false);

  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState("");

  const [pubName, setPubName] = useState("");


  const [ethPrice, setPrice] = useState("");
  const [gas, setGas] = useState("");

  const [amount, setAmount] = useState("");

  const [domainName, setDomainName] = useState("");
  const [primaryName, setPrimary] = useState("");

  const connect = async () => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      await provider.send("eth_requestAccounts", []);
      const signer = provider.getSigner()
      const chain = await signer.getChainId();
      console.log(chain)
      if (chain !== 11155111) {
        alert("Please Switch to Sepolia Testnet")
      } else {
        await signer.signMessage("Welcome to Pub's House!");
        const contract = new ethers.Contract(CHAT_CONTRACT_ADDRESS, chatABI, signer);
        const messages = await contract.getMessages();
        setMessages(messages);

        const address = await signer.getAddress();
        const displayAddress = address?.substr(0, 6) + "...";
        const pnsContract = new ethers.Contract(PNS_ADDRESS, PNS_ABI, signer);
        const pns = await pnsContract.getPrimaryDomain(address);
        console.log(pns)
        getGasPrice()
        if (pns !== "") {
          setPubName(pns)
        } else {
          setPubName(displayAddress)
        }
        getEthPrice().then((price) => {
          console.log(`ETH Price: ${price}`);
        }).catch((error) => {
          console.error(error);
        });
        setConnected(true)
        setChatContract(contract)
      }


    } catch (error) {
      alert(error.message)
    }
  }

  const disconnect = async () => {
    setConnected(false)
    setMessages([])
  }


  function handleMessageEvent(sender, message) {
    setMessages((messages) => [...messages, { sender, message }]);
  }

  async function sendMessage() {
    const get = await chatContract.sendMessage(currentMessage);
    await get.wait()
    const messages = await chatContract.getMessages();
    setMessages(messages);
    setCurrentMessage("");
    chatContract.on("NewMessage", handleMessageEvent);
  }

  async function displayMessages() {
    const renderedMessages = await Promise.all(
      messages.slice().reverse().map(async (message, i) => {
        const provider = new ethers.providers.Web3Provider(window.ethereum)
        await provider.send("eth_requestAccounts", []);
        const signer = provider.getSigner()
        const senderAddress = message.sender;
        const pnsContract = new ethers.Contract(PNS_ADDRESS, PNS_ABI, signer);
        const pns = await pnsContract.getPrimaryDomain(senderAddress);
        const ensProvider = new ethers.providers.InfuraProvider('mainnet');
        const ens = await ensProvider.lookupAddress(senderAddress);
        return (
          <div key={i} className="message-box">
            <div style={{ width: "15%" }}>
              <p className="message-sender">From: {pns || ens || (senderAddress.substr(0, 6) + "...")}</p>
            </div>
            <div style={{ width: "100%" }}>
              <p className="message-text">{message.message}</p>
            </div>
          </div>
        );
      })
    );
    setRenderedMessages(renderedMessages);
  }

  useEffect(() => {
    displayMessages();
  }, [messages]);

  const chat = async () => {
    setShowChat(true)
  }

  const closeChat = async () => {
    setShowChat(false)
  }


  async function getEthPrice() {
    // Connect to the Ethereum network using Ethers.js
    const uniProvider = new ethers.providers.InfuraProvider('mainnet');

    // Set up the Uniswap contract using its address and ABI
    const uniswapContractAddress = '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D';
    const uniswapContractAbi = [
      'function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)'
    ];
    const uniswapContract = new ethers.Contract(uniswapContractAddress, uniswapContractAbi, uniProvider);

    // Get the price of 1 ETH in USDC by querying Uniswap
    const ethAddress = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2';
    const usdcAddress = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
    const amountIn = ethers.utils.parseUnits('1', 18); // 1 ETH
    const amounts = await uniswapContract.getAmountsOut(amountIn, [ethAddress, usdcAddress]);
    const ethPriceInUsdc = amounts[1].toString();
    const ethPrice = (Number.parseFloat(ethPriceInUsdc) / 1e6).toFixed(2);
    setPrice('eth: $' + ethPrice)
    return ethPriceInUsdc;
  }

  async function getGasPrice() {
    // Connect to the Ethereum network using Ethers.js
    const provider = new ethers.providers.InfuraProvider('mainnet');

    // Get the current gas price from the network
    const gasPriceInWei = await provider.getGasPrice();
    const gasPriceInGwei = ethers.utils.formatUnits(gasPriceInWei, 'gwei');
    const parseGas = (Number.parseFloat(gasPriceInGwei)).toFixed(0)
    setGas('gas: ' + parseGas + ' gwei')
    return gasPriceInGwei;
  }

  const tip = async () => {
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    const signer = await provider.getSigner();
    const address = "0xBC72198d65075Fdad2CA7B8db79EfF5B51c8B30D"
    const amountInWei = ethers.utils.parseEther(amount);
    const tx = await signer.sendTransaction({ to: address, value: amountInWei });
    const receipt = await tx.wait(1);
    console.log(receipt);
    alert("thank you 🙏");
  }

  const handleChange = (event) => {
    setAmount(event.target.value)
  }

  const registerDomain = async (domainName) => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = provider.getSigner();
      const pnsContract = new ethers.Contract(PNS_ADDRESS, PNS_ABI, signer);
      const transaction = await pnsContract.registerDomain(domainName);
      await transaction.wait();
    } catch (error) {
      console.error(error);
    }
  }

  const handleRegisterDomain = async (event) => {
    event.preventDefault();
    await registerDomain(domainName);
  };

  const setPrimaryDomain = async (primaryName) => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = provider.getSigner();
      const pnsContract = new ethers.Contract(PNS_ADDRESS, PNS_ABI, signer);
      const transaction = await pnsContract.setPrimaryDomain(primaryName);
      await transaction.wait();
      setPubName(transaction)
    } catch (error) {
      console.error(error);
    }
  }

  const handleSetPrimaryDomain = async (event) => {
    event.preventDefault();
    await setPrimaryDomain(primaryName);
    setPubName(primaryName)
  }

  return (
    <div className="App">
      <header className="App-header">

        <h1 className="title">pub-gmn.eth</h1>
        <hr className="line" />
        {!connected && (
          <button className="connect-button" onClick={connect}>connect</button>
        )}

        {connected && (
          <>
            <button className="disconnect-button" onClick={disconnect}>
              {pubName}
            </button>

            {!showChat && (
              <button className="chatBtn" onClick={chat}>chat</button>
            )}

            {showChat && (

              <>
                <div className="chat">
                  <div className="message-container hideScroll">{renderedMessages}</div>
                  <div className="input-container">
                    <input
                      type="text"
                      value={currentMessage}
                      onChange={(e) => setCurrentMessage(e.target.value)} />
                    <button className="send-button" onClick={sendMessage}>
                      send
                    </button>
                    <button className="closeChatBtn" onClick={closeChat}>X</button>
                  </div>
                </div>
              </>
            )}

            <div className="ethPrice">
              {ethPrice}
            </div>

            <div className="gas">
              {gas}
            </div>

            <div className="tip">
              <button onClick={tip}>tip pub</button>
              <input onChange={handleChange} placeholder='amount'>
              </input>
            </div>

            <div className="pns">
              <div className="registerPub">
                <form onSubmit={handleRegisterDomain}>
                  <input
                    type="text"
                    placeholder="register pns"
                    value={domainName}
                    onChange={(event) => setDomainName(event.target.value)} />
                  <button className="registerButtons" type="submit">claim .pub</button>
                </form>
              </div>

              <br />

              <div className="primaryPub">
                <form onSubmit={handleSetPrimaryDomain}>
                  <input
                    type="text"
                    placeholder="me.pub"
                    value={primaryName}
                    onChange={(event) => setPrimary(event.target.value)}
                  />
                  <button className="registerButtons" type="submit">set primary</button>
                </form>
              </div>
            </div>
          </>
        )}

        <div className="contentContainer hideScroll">
          <h3 className="label">pub's picks...</h3>
          <div className="content">
            <div className="cont">
            <div className="uniswap">
              <a href="https://app.uniswap.org/#/swap" target="_blank" rel="noreferrer">
                <img className="logo" src={uniswapLogo} alt="uniswap" />
              </a>
            </div>
            </div>
            <div className="cont">
            <div className="aave">
              <a href="https://app.aave.com/?marketName=proto_mainnet" target="_blank" rel="noreferrer">
                <img className="logo" src={aaveLogo} alt="aave" />
              </a>
            </div>
            </div>
            <div className="cont">
            <div className="eth">
              <a href="https://ethereum.org/en/" target="_blank" rel="noreferrer">
                <img className="logo" src={ethLogo} alt="ethereum.org" />
              </a>
            </div>
            </div>
          </div>

          <h3 className="label">pub's projects...</h3>
          <div className="content">
          <div className="cont">
            <div className="uniswap">
              <a href="https://goodmorningnews.club" target="_blank" rel="noreferrer">
                <img className="logo" src={gmnLogo} alt="gmn" />
              </a>
            </div>
            </div>
            <div className="cont">
            <div className="aave">
              <a href="https://www.banklesspublishing.xyz/" target="_blank" rel="noreferrer">
                <img className="logo" src={bpLogo} alt="bankless publishing" />
              </a>
            </div>
            </div>
            <div className="cont">
            <div className="eth">
              <a href="https://blockchainlawyers.group/" target="_blank" rel="noreferrer">
                <img className="logo" src={blgLogo} alt="ethereum.org" />
              </a>
            </div>
            </div>
          </div>

          <h3 className="label">pub's prototypes...</h3>
          <div className="content">
          <div className="cont">
            <div className="uniswap">
              <a href="https://bank-of-ethereum-v2.vercel.app/" target="_blank" rel="noreferrer">
                <img className="logo" src={boeLogo} alt="bank of ethereum" />
              </a>
            </div>
            </div>
            <div className="cont">
            <div className="aave">
              <a href="https://work-in-progress.vercel.app/" target="_blank" rel="noreferrer">
                <img className="logo" src={mandalorLogo} alt="aave" />
              </a>
            </div>
            </div>
            <div className="cont">
            <div className="eth">
              <a href="https://eth-rpg.vercel.app/" target="_blank" rel="noreferrer">
                <img className="logo" src={etherQuest} alt="EtherQuest" />
              </a>
            </div>
            </div>
          </div>
        </div>
      </header>
    </div>
  );
}

export default App;
