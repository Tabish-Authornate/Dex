// import react from "react";
import Web3 from "web3";
const ABI = require("./abi.json");
const pairABI = require("./pairABI.json");
const addresses = require("./addresses.json");
// const tokenABI = require("./tokenABI.json");
const Rpc_Url = "https://mainnet.infura.io/v3/121e387db5e842e69e3fd77abac14694";
const web3Provider = new Web3.providers.HttpProvider(Rpc_Url);
const web3 = new Web3(web3Provider);
const axios = require("axios").default;
var factoryContract = new web3.eth.Contract(
  ABI,
  "0xc0aee478e3658e2610c5f7a4a2e1777ce9e4f2ac"
);
web3.eth.getBlockNumber().then((result) => {
  console.log("Block Number : ", result);
  for (let index = 0; index < addresses.length; index++) {
    console.log("<<<<<<<<<<", addresses[index].name, ">>>>>>>>>>");
    for (let index1 = 0; index1 < addresses[index].Dexes.length; index1++) {
      console.log(
        "Dex",
        index1 + 1,
        " : ",
        addresses[index].Dexes[index1].name,
        " : ",
        addresses[index].Dexes[index1].address
      );
    }
  }
});
var counter = 0;
function App() {
  let blockNumber;

  const checkReserves = async (item) => {
    const latest = await web3.eth.getBlock("latest");
    let events, blockData, lastEvent;
    try {
      events = await getPastLogs(1, latest.number, item.returnValues.pair);
      lastEvent = events.slice(-1);
    } catch (error) {
      return;
    }
    try {
      blockData = await web3.eth.getBlock(lastEvent[0].blockNumber);
    } catch (error) {
      return;
    }

    if (blockData.timestamp > latest.timestamp - 604800) {
      console.log(
        "Pair : ",
        item.returnValues.pair,
        "  Total Events: ",
        events.length,
        "  Status : Active"
      );
    }

    // var pairContract = new web3.eth.Contract(pairABI, item.returnValues.pair);
    // const result = await pairContract.methods.getReserves().call();

    // if (
    //   parseInt(result._reserve0.toString()) > 0 &&
    //   parseInt(result._reserve1.toString()) > 0
    // ) {
    //   console.log("Pairs");
    // var tokenContract = new web3.eth.Contract(
    //   tokenABI,
    //   item.returnValues.token0
    // );
    // const token1 = await tokenContract.methods.name().call();
    // console.log("Name reserve 1", token1.toString());
    // tokenContract = new web3.eth.Contract(tokenABI, item.returnValues.token1);
    // const token2 = await tokenContract.methods.name().call();
    // console.log("Name reserve 2", token2.toString());
    // }
  };

  const getPastEvents = async (start, end) => {
    var events = await getPastLogs(start, end);
    await events.forEach(checkReserves);
  };
  const getValues = async () => {
    const latest = await web3.eth.getBlock("latest");
    const interval = Math.round(parseInt(latest.number / 100000));
    console.log("Latest Block", latest.number);
    console.log("Interval", interval);
    console.log("Deployment BlockNumber", blockNumber);
    var start = parseInt(latest.number - 50000);
    var end = parseInt(latest.number);
    for (; end <= latest.number; end = end + interval) {
      await getPastEvents(start, end);
      start = end;
      counter++;
      if (end + interval >= parseInt(latest.number)) {
        await getPastEvents(start, latest.number);
        console.log("Last Interval", parseInt(latest.number) - end);
        break;
      }
    }
    console.log("Counter", counter);
  };
  async function getPastLogs(fromBlock, toBlock, pair) {
    if (fromBlock <= toBlock) {
      try {
        if (pair) {
          var pairContract = new web3.eth.Contract(pairABI, pair);
          return await pairContract.getPastEvents("Transfer", {
            // Using an array means OR: e.g. 20 or 23
            fromBlock: fromBlock,
            toBlock: toBlock,
          });
        } else {
          return await factoryContract.getPastEvents("PairCreated", {
            // Using an array means OR: e.g. 20 or 23
            fromBlock: fromBlock,
            toBlock: toBlock,
          });
        }
      } catch (error) {
        if (pair) {
          const midBlock = (fromBlock + toBlock) >> 1;
          const arr1 = await getPastLogs(fromBlock, midBlock, pair);
          const arr2 = await getPastLogs(midBlock + 1, toBlock, pair);
          return [...arr1, ...arr2];
        } else {
          const midBlock = (fromBlock + toBlock) >> 1;
          const arr1 = await getPastLogs(fromBlock, midBlock);
          const arr2 = await getPastLogs(midBlock + 1, toBlock);
          return [...arr1, ...arr2];
        }
      }
    }
    return [];
  }
  const getBlock = async () => {
    await axios
      .get(
        "https://api.etherscan.io/api?module=account&action=txlist&address=0xC0AEe478e3658e2610c5F7A4A2E1777cE9e4f2Ac&startblock=0&endblock=99999999&page=1&offset=10&sort=asc&apikey=YourApiKeyToken"
      )
      .then(function (response) {
        // handle success

        blockNumber = response.data.result[0].blockNumber;
      })
      .catch(function (error) {
        // handle error
        console.log(error);
      });
    getValues();
  };
  return (
    <div>
      <button onClick={getBlock}>Get</button>
    </div>
  );
}

export default App;
