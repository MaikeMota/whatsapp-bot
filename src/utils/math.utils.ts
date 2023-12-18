import { WalletPosition } from "../services/wallet/wallet.position.interface";

export function calculateNewPosition(
    currentAveragePrice: number,
    currentQuantity: number,
    unitaryValueFromNewBuy: number,
    quantityFromNewBuy: number): NewPosition {

    const quantity = currentQuantity + quantityFromNewBuy;
    const averagePrice = ((currentAveragePrice * currentQuantity) + (unitaryValueFromNewBuy * quantityFromNewBuy)) / (quantity);

    return {
        quantidade: quantity,
        precoMedio: averagePrice
    }
}

export function getPercentualDiff(initialValue: number, currentValue: number) {
    return ((currentValue - initialValue) / initialValue) * 100;
}

export function roundNumberTo(number: number, roundAt: number) {
    const theRest = number % roundAt;
    const roundedViews = Math.floor(number - theRest);
    return roundedViews;
}

type NewPosition = Pick<WalletPosition, 'quantidade' | 'precoMedio'> 
