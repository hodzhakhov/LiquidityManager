import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

describe("LiquidityManager", function () {
  async function deployContract() {
    const npmAddress = "0xC36442b4a4522E871399CD717aBDD847Ab11FE88";

    const liquidityManager = await hre.ethers.deployContract("LiquidityManager", [npmAddress]);

    return liquidityManager;
  }

  describe("Deployment", function () {
    it("Should get right npmManager address", async function () {
      const liquidityManager = await loadFixture(deployContract);

      expect(await liquidityManager.positionManager()).to.equal("0xC36442b4a4522E871399CD717aBDD847Ab11FE88");
    });
  });

  /*describe("PoolInfo", function () {
    it("Should return pool info", async function () {
      const liquidityManager = await loadFixture(deployContract);

      let ans = await liquidityManager.getPoolInfo("0x88e6A0c2dDD26FEEb64F039a2c41296FcB3f5640");

      console.log(ans[0]);
      console.log(ans[1]);
      console.log(ans[2]);
      console.log(ans[3]);
    })
  });*/

  describe("Maths", function () {
    it("tick_lower should be less than tick_upper", async function () {
      const liquidityManager = await loadFixture(deployContract);

      const { tick_lower, tick_upper } = await liquidityManager.countTicks(376990060, 5, BigInt(1e18), BigInt(1287 * 10 ** 6));
      console.log(tick_lower);
      console.log(tick_upper);

      expect(tick_lower).be.lessThan(tick_upper);
    })
  });
 });
