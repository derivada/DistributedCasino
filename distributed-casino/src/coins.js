/**
 * Returns the location of the coin image
 * @param {int} coin ID of the coin, between 1 and 2
 */
function getCoinLocation(coin) {
    return "/images/coins/coin" + coin + ".svg";
}

module.exports = { getCoinLocation };
