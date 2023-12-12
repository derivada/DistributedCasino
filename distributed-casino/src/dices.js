/**
 * Returns the location of the card image
 * @param {int} dice ID of the card, between 1 and 52
 */
function getDiceLocation(dice) {
    return "/images/dices/dice" + dice + ".svg";
}

module.exports = { getDiceLocation };
