// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const npmAddress = "0xC36442b4a4522E871399CD717aBDD847Ab11FE88";

const LiquidityManagerModule = buildModule("LiquidityManagerModule", (m) => {
  const address = m.getParameter("npmAddress", npmAddress);

  const liquidityManager = m.contract("LiquidityManager", [npmAddress]);

  return { liquidityManager };
});

export default LiquidityManagerModule;
