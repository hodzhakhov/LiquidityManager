// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./Interfaces.sol";

contract LiquidityManager {
    INonfungiblePositionManager public positionManager;

    constructor(address npmAddress) {
        positionManager = INonfungiblePositionManager(
            npmAddress
        );
    }

    function getPoolInfo(address poolAddress) public view returns (address, address, uint24, uint256){
        IUniswapV3Pool pool = IUniswapV3Pool(poolAddress);

        address token0 = pool.token0();
        address token1 = pool.token1();
        uint24 pool_fee = pool.fee();

        (uint160 sqrtPriceX96, , , , , , ) = pool.slot0();
        uint256 price = (sqrtPriceX96 * sqrtPriceX96) / (2 ** 192);

        return (token0, token1, pool_fee, price);
    }

    function countBorders(uint256 price, uint256 width, uint256 decAmount0, uint256 decAmount1) internal pure returns (uint256 pa, uint256 pb) {
        uint256 d = (width + 10**4) * ((price * decAmount0) ** 2 - 2 * price * decAmount0 * decAmount1 + decAmount1 ** 2) + 4 * decAmount0 * decAmount1 * price * sqrt(10**8 - width**2);
        uint256 sqrt_pb = (sqrt(width + 10**4) * (price * decAmount0 - decAmount1) + sqrt(d)) / (2 * decAmount0 * sqrt(price * (10**4 - width)));
        uint256 sqrt_pa = decAmount1 / (sqrt_pb * decAmount0) + sqrt(price) - decAmount1 / (sqrt(price) * decAmount0);
        pa = sqrt_pa * (2 ** 96);
        pb = sqrt_pb * (2 ** 96);
    }

    function countTicks(uint256 price, uint256 width, uint256 decAmount0, uint256 decAmount1) public pure returns (int24 tick_lower, int24 tick_upper) {
        (uint256 pa, uint256 pb) = countBorders(price, width, decAmount0, decAmount1);

        uint160 sqrtPriceA96 = SafeCast.toUint160(pa);
        uint160 sqrtPriceB96 = SafeCast.toUint160(pb);

        tick_lower = TickMath.getTickAtSqrtRatio(sqrtPriceA96);
        tick_upper = TickMath.getTickAtSqrtRatio(sqrtPriceB96);
    }

    function addLiquidity(
        address poolAddress,
        uint256 amount0,
        uint256 amount1,
        uint256 width
    ) external returns (int24, int24) {
        require(amount0 != 0, 'Cannot add 0 amount of first token');
        require(amount1 != 0, 'Cannot add 0 amount of second token');
        require(width != 0, 'Cannot add liquidity with 0 width');

        (address token0, address token1, uint24 pool_fee, uint256 price) = getPoolInfo(poolAddress);

        uint256 decAmount0 = amount0;
        uint256 decAmount1 = amount1;

        (int24 tick_lower, int24 tick_upper) = countTicks(price, width, decAmount0, decAmount1);

        IERC20(token0).transferFrom(msg.sender, address(this), decAmount0);
        IERC20(token1).transferFrom(msg.sender, address(this), decAmount1);

        IERC20(token0).approve(address(positionManager), decAmount0);
        IERC20(token1).approve(address(positionManager), decAmount1);

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
