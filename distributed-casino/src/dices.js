/**
 * Returns the location of the dice image
 * @param {int} dice ID of the dice, between 1 and 6
 */
function getDiceLocation(dice) {
    return "/images/dices/dice" + dice + ".svg";
}

module.exports = { getDiceLocation };
