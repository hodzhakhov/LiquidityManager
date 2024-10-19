import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "dotenv/config";

export const ARBITRUM_ENDPOINT = "0x3c2269811836af69497E5F486A85D7316753cf62";
export const ARBITRUM_CHAINID = 110;

const config: HardhatUserConfig = {
  solidity: "0.8.27",
  networks: {
    arbitrum_one: {
      url: process.env.ARBITRUM_URL as string,
      accounts: [process.env.PRIVATE_KEY as string]
    }
  },
};

export default config;
