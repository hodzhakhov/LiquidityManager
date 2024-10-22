import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre, { ethers } from "hardhat";
import { deal } from "hardhat-deal";

describe("LiquidityManager", function () {
  async function deployContract() {
    const [owner] = await hre.ethers.getSigners();

    const npmAddress = "0xC36442b4a4522E871399CD717aBDD847Ab11FE88";

    const nfpManager = await ethers.getContractAt(
      "INonfungiblePositionManager", npmAddress
    );

    const liquidityManager = await hre.ethers.deployContract("LiquidityManager", [npmAddress]);

    const pool = await ethers.getContractAt("IUniswapV3Pool", "0x88e6A0c2dDD26FEEb64F039a2c41296FcB3f5640");

    const token0 = await ethers.getContractAt("IERC20", await pool.token0());
    const token1 = await ethers.getContractAt("IERC20", await pool.token1());

    await token0.approve(liquidityManager, ethers.MaxUint256);
    await token1.approve(liquidityManager, ethers.MaxUint256);

    await deal(token0, owner, ethers.parseUnits("1000", 6));
    await deal(token1, owner, ethers.parseUnits("2", 18));

    console.log(await token0.balanceOf(owner));
    console.log(await token1.balanceOf(owner));

    return { owner, liquidityManager, token0, token1, pool, nfpManager };
  }

  describe("Deployment", function () {
    it("Should get right npmManager address", async function () {
      const { liquidityManager } = await loadFixture(deployContract);

      expect(await liquidityManager.positionManager()).to.equal("0xC36442b4a4522E871399CD717aBDD847Ab11FE88");
    });
  });

  describe("Maths", function () {
    const width = 1000;
    it(`Should provide liquidity with width = 1000 when amount0 = 0`, async function () {
      const { liquidityManager, nfpManager, pool, owner, token1 } = await loadFixture(deployContract);

      const amount1 = await token1.balanceOf(owner);
      await liquidityManager.addLiquidity(pool, 0, amount1, width)

      const positionId = await nfpManager.tokenOfOwnerByIndex(owner, 0);
      const position = await nfpManager.positions(positionId);

      const upperPrice = 1.0001 ** Number(position.tickUpper);
      const lowerPrice = 1.0001 ** Number(position.tickLower)

      expect(10000 * (upperPrice - lowerPrice) / (lowerPrice + upperPrice)).to.be.approximately(width, width * 0.1);
    })

    it(`Should provide liquidity with width = 1000 when amount1 = 0`, async function () {
      const { liquidityManager, nfpManager, pool, owner, token0 } = await loadFixture(deployContract);

      const amount0 = await token0.balanceOf(owner);
      await liquidityManager.addLiquidity(pool, amount0, 0, width)

      const positionId = await nfpManager.tokenOfOwnerByIndex(owner, 0);
      const position = await nfpManager.positions(positionId);

      const upperPrice = 1.0001 ** Number(position.tickUpper);
      const lowerPrice = 1.0001 ** Number(position.tickLower)

      expect(10000 * (upperPrice - lowerPrice) / (lowerPrice + upperPrice)).to.be.approximately(width, width * 0.1);
    });

    it(`Should provide liquidity with width = 1000`, async function () {
      const { liquidityManager, nfpManager, pool, owner, token0, token1 } = await loadFixture(deployContract);

      const amount0 = await token0.balanceOf(owner);
      const amount1 = await token1.balanceOf(owner);
      await liquidityManager.addLiquidity(pool, amount0, amount1, width)

      const positionId = await nfpManager.tokenOfOwnerByIndex(owner, 0);
      const position = await nfpManager.positions(positionId);

      const upperPrice = 1.0001 ** Number(position.tickUpper);
      const lowerPrice = 1.0001 ** Number(position.tickLower)

      expect(10000 * (upperPrice - lowerPrice) / (lowerPrice + upperPrice)).to.be.approximately(width, width * 0.1);
    });
  });
});
