import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import hre from "hardhat";

describe("LiquidityManager", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
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
  /*
  
  describe("Withdrawals", function () {
    describe("Validations", function () {
      it("Should revert with the right error if called too soon", async function () {
        const { lock } = await loadFixture(deployOneYearLockFixture);
  
        await expect(lock.withdraw()).to.be.revertedWith(
          "You can't withdraw yet"
        );
      });
  
      it("Should revert with the right error if called from another account", async function () {
        const { lock, unlockTime, otherAccount } = await loadFixture(
          deployOneYearLockFixture
        );
  
        // We can increase the time in Hardhat Network
        await time.increaseTo(unlockTime);
  
        // We use lock.connect() to send a transaction from another account
        await expect(lock.connect(otherAccount).withdraw()).to.be.revertedWith(
          "You aren't the owner"
        );
      });
  
      it("Shouldn't fail if the unlockTime has arrived and the owner calls it", async function () {
        const { lock, unlockTime } = await loadFixture(
          deployOneYearLockFixture
        );
  
        // Transactions are sent using the first signer by default
        await time.increaseTo(unlockTime);
  
        await expect(lock.withdraw()).not.to.be.reverted;
      });
    });
  
    describe("Events", function () {
      it("Should emit an event on withdrawals", async function () {
        const { lock, unlockTime, lockedAmount } = await loadFixture(
          deployOneYearLockFixture
        );
  
        await time.increaseTo(unlockTime);
  
        await expect(lock.withdraw())
          .to.emit(lock, "Withdrawal")
          .withArgs(lockedAmount, anyValue); // We accept any value as `when` arg
      });
    });
  
    describe("Transfers", function () {
      it("Should transfer the funds to the owner", async function () {
        const { lock, unlockTime, lockedAmount, owner } = await loadFixture(
          deployOneYearLockFixture
        );
  
        await time.increaseTo(unlockTime);
  
        await expect(lock.withdraw()).to.changeEtherBalances(
          [owner, lock],
          [lockedAmount, -lockedAmount]
        );
      });
    });
  });*/
});
