// import react from "react";
import Web3 from "web3";
const ABI = require("./abi.json");
const pairABI = require("./pairABI.json");
const addresses = require("./addresses.json");
const keys = require("./keys.json");
const tokenABI = require("./tokenABI.json");
const axios = require("axios").default;
var Rpc_Url = "";
var web3Provider = null;
var web3 = null;
// web3.eth.getBlockNumber().then((result) => {
//   console.log("Block Number : ", result);
//   for (let index = 0; index < addresses.length; index++) {
//     console.log("<<<<<<<<<<", addresses[index].name, ">>>>>>>>>>");
//     for (let index1 = 0; index1 < addresses[index].Dexes.length; index1++) {
//       console.log(
//         "Dex",
//         index1 + 1,
//         " : ",
//         addresses[index].Dexes[index1].name,
//         " : ",
//         addresses[index].Dexes[index1].address
//       );
//     }
//   }
// });
var counter = 0;
function App() {
  const checkReserves = async (item) => {
    //const latest = await web3.eth.getBlock("latest");
    // var pairContract = new web3.eth.Contract(pairABI, item.returnValues.pair);

    // var tokenSymbol;
    // try {
    //   tokenSymbol = await pairContract.methods.symbol().call();
    // } catch {
    //   return;
    // }
    var tokenContract1 = new web3.eth.Contract(
      tokenABI,
      item.returnValues.token0
    );
    var tokenContract2 = new web3.eth.Contract(
      tokenABI,
      item.returnValues.token1
    );
    var token1, token2;
    try {
      token1 = await tokenContract1.methods.symbol().call();
      token2 = await tokenContract2.methods.symbol().call();
    } catch {
      return;
    }

    console.log(
      "Pair : ",
      item.returnValues.pair,
      " Symbol1 : ",
      token1,
      " Symbol2 : ",
      token2
    );
    // let events, blockData, lastEvent;
    // try {
    //   events = await getPastLogs(
    //     1,
    //     latest.number,
    //     item.returnValues.pair,
    //     true
    //   );
    //   lastEvent = events.slice(-1);
    // } catch (error) {
    //   return;
    // }
    // try {
    //   blockData = await web3.eth.getBlock(lastEvent[0].blockNumber);
    // } catch (error) {
    //   return;
    // }

    // if (blockData.timestamp > latest.timestamp - 604800) {
    //   console.log(
    //     "Pair : ",
    //     item.returnValues.pair,
    //     "  Total Events: ",
    //     events.length,
    //     "  Status : Active"
    //   );
    // }

    // var pairContract = new web3.eth.Contract(pairABI, item.returnValues.pair);
    // const result = await pairContract.methods.getReserves().call();

    // if (
    //   parseInt(result._reserve0.toString()) > 0 &&
    //   parseInt(result._reserve1.toString()) > 0
    // ) {
    //   console.log("Pairs");
    // var tokenContract = new web3.eth.Contract(
    //   tokenABI,
    //   item.returnVal ues.token0
    // );
    // const token1 = await tokenContract.methods.name().call();
    // console.log("Name reserve 1", token1.toString());
    // tokenContract = new web3.eth.Contract(tokenABI, item.returnValues.token1);
    // const token2 = await tokenContract.methods.name().call();
    // console.log("Name reserve 2", token2.toString());
    // }
  };
  const getData = async () => {
    for (let index = 0; index < addresses.length; index++) {
      console.log("<<<<<<<<<<", addresses[index].name, ">>>>>>>>>>");
      Rpc_Url = addresses[index].RPC_Url;
      web3Provider = new Web3.providers.HttpProvider(Rpc_Url);
      web3 = new Web3(web3Provider);
      for (let index1 = 0; index1 < addresses[index].Dexes.length; index1++) {
        console.log("Dex Name : ", addresses[index].Dexes[index1].name);
        await getBlock(
          addresses[index].name,
          addresses[index].Dexes[index1].address
        );
      }
    }
  };

  const getPastEvents = async (start, end, address) => {
    var events = await getPastLogs(start, end, address);
    await events.forEach(checkReserves);
  };
  const getValues = async (address, blockNumber) => {
    const latest = await web3.eth.getBlock("latest");

    const interval = Math.round(parseInt(latest.number / 100000));
    console.log("Latest Block", latest.number);
    console.log("Interval", interval);
    console.log("Deployment BlockNumber", blockNumber);
    var start = parseInt(latest.number - 10000);
    var end = start + interval;
    for (; end <= latest.number; end = end + interval) {
      await getPastEvents(start, end, address);
      start = end;
      counter++;
      if (end + interval >= parseInt(latest.number)) {
        await getPastEvents(start, latest.number, address);
        console.log("Last Interval", parseInt(latest.number) - end);
        break;
      }
    }
    console.log("Counter", counter);
  };
  async function getPastLogs(fromBlock, toBlock, address, pair) {
    if (fromBlock <= toBlock) {
      try {
        if (pair) {
          var pairContract = new web3.eth.Contract(pairABI, address);
          return await pairContract.getPastEvents("Transfer", {
            // Using an array means OR: e.g. 20 or 23
            fromBlock: fromBlock,
            toBlock: toBlock,
          });
        } else {
          var factoryContract = new web3.eth.Contract(ABI, address);

          return await factoryContract.getPastEvents("PairCreated", {
            // Using an array means OR: e.g. 20 or 23
            fromBlock: fromBlock,
            toBlock: toBlock,
          });
        }
      } catch (error) {
        if (pair) {
          const midBlock = (fromBlock + toBlock) >> 1;
          const arr1 = await getPastLogs(fromBlock, midBlock, address, pair);
          const arr2 = await getPastLogs(midBlock + 1, toBlock, address, pair);
          return [...arr1, ...arr2];
        } else {
          const midBlock = (fromBlock + toBlock) >> 1;
          const arr1 = await getPastLogs(fromBlock, midBlock, address);
          const arr2 = await getPastLogs(midBlock + 1, toBlock, address);
          return [...arr1, ...arr2];
        }
      }
    }
    return [];
  }
  const getBlock = async (network, address) => {
    if (network === "Ethereum") {
      await axios
        .get(
          `https://api.etherscan.io/api?module=account&action=txlist&address=` +
            address +
            `&startblock=0&endblock=99999999&page=1&offset=10&sort=asc&apikey=` +
            keys.Etheruem
        )
        .then(async function (response) {
          // handle success
          await getValues(address, response.data.result[0].blockNumber);
          await sleep(5000);
        })
        .catch(function (error) {
          // handle error
          console.log(error);
        });
    } else if (network === "Binance") {
      await axios
        .get(
          `https://api.bscscan.com/api?module=account&action=txlist&address=` +
            address +
            `&startblock=0&endblock=99999999&page=1&offset=10&sort=asc&apikey=` +
            keys.Binance
        )
        .then(async function (response) {
          // handle success
          await getValues(address, response.data.result[0].blockNumber);
          await sleep(5000);
        })
        .catch(function (error) {
          // handle error
          console.log(error);
        });
    } else if (network === "Polygon") {
      await axios
        .get(
          `https://api.polygonscan.com/api?module=account&action=txlist&address=` +
            address +
            `&startblock=1&endblock=99999999&sort=asc&apikey=` +
            keys.Polygon
        )
        .then(async function (response) {
          // handle success
          await getValues(address, response.data.result[0].blockNumber);
          await sleep(5000);
        })
        .catch(function (error) {
          // handle error
          console.log(error);
        });
    } else if (network === "Avalanche") {
      await axios
        .get(
          `https://api.snowtrace.io/api?module=account&action=txlist&address=` +
            address +
            `&startblock=1&endblock=99999999&sort=asc&apikey=` +
            keys.Avalanche
        )
        .then(async function (response) {
          // handle success
          await getValues(address, response.data.result[0].blockNumber);
          await sleep(5000);
        })
        .catch(function (error) {
          // handle error
          console.log(error);
        });
    } else {
      return;
    }
  };
  const sleep = async (milliseconds) => {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
  };
  return (
    <div>
      <button onClick={getData}>Get</button>
    </div>
  );
}

export default App;
