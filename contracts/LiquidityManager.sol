// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./Interfaces.sol";
import "hardhat/console.sol";

contract LiquidityManager {
    INonfungiblePositionManager public positionManager;

    constructor(address npmAddress) {
        positionManager = INonfungiblePositionManager(
            npmAddress
        );
    }

    function getPoolInfo(address poolAddress) public view returns (address, address, uint24, uint160, int24){
        IUniswapV3Pool pool = IUniswapV3Pool(poolAddress);

        address token0 = pool.token0();
        address token1 = pool.token1();
        uint24 pool_fee = pool.fee();
        int24 tickSpacing = pool.tickSpacing();

        (uint160 sqrtPriceX96, , , , , , ) = pool.slot0();

        return (token0, token1, pool_fee, sqrtPriceX96, tickSpacing);
    }

    function countBorders(uint160 price, uint256 width, uint256 decAmount0, uint256 decAmount1) internal pure returns (uint160 pa, uint160 pb) {
        //uint256 sb = sqrt((10000 - width) / (10000 + width));
        
        if (decAmount0 == 0) {
            pb = price;
            pa = uint160(sqrt(FullMath.mulDiv(FullMath.mulDiv(pb, pb, 1), (10000 - width), (10000 + width))));
        } else if (decAmount1 == 0) {
            pa = price;
            pb = uint160(sqrt(FullMath.mulDiv(FullMath.mulDiv(pa, pa, 1), (10000 + width), (10000 - width))));
        } else {
            uint256 s = sqrt(FullMath.mulDiv((10000 - width), 1, (10000 + width)));
            uint256 t = price - FullMath.mulDiv(decAmount1, 1, FullMath.mulDiv(price, decAmount0, 1));
            uint256 d = sqrt(FullMath.mulDiv(decAmount0, FullMath.mulDiv(t, t, 1), 1) + 4 * FullMath.mulDiv(s, FullMath.mulDiv(decAmount0, decAmount1, 1), 1));
            pb = uint160(FullMath.mulDiv(d + FullMath.mulDiv(t, decAmount0, 1), 1, 2 * FullMath.mulDiv(decAmount0, s, 1)));
            pa = uint160(sqrt(FullMath.mulDiv(FullMath.mulDiv(pb, pb, 1), (10000 - width), (10000 + width))));
        }
    }

    function countTicks(uint160 price, uint256 width, uint256 decAmount0, uint256 decAmount1, int24 tickSpacing) public pure returns (int24 tick_lower, int24 tick_upper) {
        (uint160 pa, uint160 pb) = countBorders(price, width, decAmount0, decAmount1);

        // uint160 sqrtPriceA96 = SafeCast.toUint160(pa);
        // uint160 sqrtPriceB96 = SafeCast.toUint160(pb);
        console.logInt(tickSpacing);

        tick_lower = TickMath.getTickAtSqrtRatio(pa);
        tick_upper = TickMath.getTickAtSqrtRatio(pb);

        if (tick_lower % tickSpacing != 0) {
            tick_lower = (tick_lower / tickSpacing) * tickSpacing + tickSpacing;
        }

        if (tick_upper % tickSpacing != 0) {
            tick_upper = (tick_upper / tickSpacing) * tickSpacing;
        }
    }

    function addLiquidity(
        address poolAddress,
        uint256 amount0,
        uint256 amount1,
        uint256 width
    ) external returns (int24, int24) {
        require(width != 0, 'Cannot add liquidity with 0 width');

        (address token0, address token1, uint24 pool_fee, uint160 price, int24 tickSpacing) = getPoolInfo(poolAddress);

        uint256 decAmount0 = amount0;
        uint256 decAmount1 = amount1;

        IERC20(token0).transferFrom(msg.sender, address(this), decAmount0);
        IERC20(token1).transferFrom(msg.sender, address(this), decAmount1);

        IERC20(token0).approve(address(positionManager), decAmount0);
        IERC20(token1).approve(address(positionManager), decAmount1);

        (int24 tick_lower, int24 tick_upper) = countTicks(price, width, decAmount0, decAmount1, tickSpacing);

        (, , uint256 remains0, uint256 remains1) = positionManager.mint(
            INonfungiblePositionManager.MintParams({
                token0: token0,
                token1: token1,
                fee: pool_fee,
                tickLower: tick_lower,
                tickUpper: tick_upper,
                amount0Desired: decAmount0,
                amount1Desired: decAmount1,
                amount0Min: 0,
                amount1Min: 0,
                recipient: msg.sender,
                deadline: block.timestamp
            })
        );

        IERC20(token0).transfer(msg.sender, decAmount0 - remains0);
        IERC20(token1).transfer(msg.sender, decAmount1 - remains1);

        return (tick_lower, tick_upper);
    }

    function sqrt(uint256 y) internal pure returns (uint256 z) {
        if (y > 3) {
            z = y;
            uint256 x = y / 2 + 1;
            while (x < z) {
                z = x;
                x = (y / x + x) / 2;
            }
        } else if (y != 0) {
            z = 1;
        }
    }
}
