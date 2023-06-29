
/**
 * Data from: https://www.b3.com.br/pt_br/market-data-e-indices/servicos-de-dados/market-data/consultas/mercado-a-vista/units/
 * Array.from(document.querySelectorAll('table.responsive tbody tr'))
    .reduce((acc, line) => {
        const [nomeColumn, tickerColumn, composicaoColumn] = line.querySelectorAll('td');
        if(composicaoColumn.textContent.includes('BDR ')){ return acc}
        const [on, pn] = composicaoColumn.textContent.split('+');
        acc[tickerColumn.textContent] = {
            nome: nomeColumn.textContent,
            on: parseInt(on.replaceAll('[^0-9]*')),            
            pn: parseInt(pn.replaceAll('[^0-9]*'))
        };
        return acc
    }, {})
 */


import { Chat, Client, Message } from "whatsapp-web.js";
import { Command } from "./command";

import { getStockInfo } from "../services/brapi.service";

import unitsInfo from '../data/units-b3.json';

interface B3Unit {
    nome: string;
    qtdOn: number;
    qtdPn: number;
    onBonifica: boolean;
}

class B3UnitInfo implements B3Unit {
    nome: string;
    qtdOn: number;
    qtdPn: number;
    onBonifica: boolean;

    precoOn?: number;
    precoPn?: number;
    precoUnit?: number

    constructor(b3Unit: B3Unit) {
        const { nome, qtdOn, qtdPn, onBonifica } = b3Unit
        this.nome = nome;
        this.qtdOn = qtdOn;
        this.qtdPn = qtdPn;
        this.onBonifica = onBonifica;
    }

    qualClasseComprar(): TipoAcao {
        if (this.precoUnit < this.precoTotalUnit) {
            return TipoAcao.UNIT;
        }
        if (this.onBonifica) {
            const proporcao = this.precoPn / this.precoOn
            return proporcao >= 1.1 ? TipoAcao.ORDINARIA : TipoAcao.PREFERENCIAL
        }
        return this.precoOn > this.precoPn ? TipoAcao.PREFERENCIAL : TipoAcao.ORDINARIA;
    }

    atualizarPrecos(unitPrice: number, onPrice: number, pnPrice: number) {
        this.precoUnit = unitPrice;
        this.precoOn = onPrice;
        this.precoPn = pnPrice;
    }

    private get precoTotalUnit() {
        return (this.precoOn * this.qtdOn) + (this.precoPn * this.qtdPn);
    }
}

export class B3UnitsCommand extends Command {
    command: string = "/unit";
    
    usageDescription: string = "<nome da unit> - Recupera informações sobre a unit informada. Ex: /unit TAEE11";

    async isUsageValid(chat: Chat, msg: Message, ...argsArray: string[]): Promise<boolean> {
        const [unitName] = argsArray;
        return !!unitName;
    }

    async handle(client: Client, chat: Chat, msg: Message, ...argsArray: string[]) {

        const [unitName] = argsArray;

        let unitNameWithSufix = normalizeUnitName(unitName);
        const unitInfo: B3UnitInfo = getB3UnitInfo(unitNameWithSufix);

        if (!unitInfo) {
            await msg.reply(`Não tenho informações sobre a Unit Solicitada (${unitNameWithSufix})`);
            return;
        }

        const tickerOn = `${unitName.replace('11', '').toUpperCase()}3`;
        const tickerPn = `${unitName.replace('11', '').toUpperCase()}4`;

        const tickersPrices = await getStockInfo([unitNameWithSufix, tickerOn, tickerPn]);
        const unitPrice = tickersPrices.success.find(t => t.ticker === unitNameWithSufix).price;
        const onPrice = tickersPrices.success.find(t => t.ticker === tickerOn).price;
        const pnPrice = tickersPrices.success.find(t => t.ticker === tickerPn).price;

        unitInfo.atualizarPrecos(unitPrice, onPrice, pnPrice);

        const whatToBuy = unitInfo.qualClasseComprar();
        const whatToBuyTicker = getTickerBasedOnStockType(whatToBuy, tickerOn, tickerPn, unitNameWithSufix);

        await msg.reply(`${unitInfo.nome} (${unitNameWithSufix})
1 *${unitNameWithSufix}* = ${unitInfo.qtdOn} *${tickerOn}* + ${unitInfo.qtdPn} *${tickerPn}*

*Cotações:*
${unitNameWithSufix}: R$ ${unitInfo.precoUnit.toString().replace('.', ',')}
${tickerOn}: R$ ${unitInfo.precoOn.toString().replace('.', ',')}
${tickerPn}: R$ ${unitInfo.precoPn.toString().replace('.', ',')}

${unitInfo.onBonifica ? 'Há' : 'Não há'} +10% em proventos nas ações PN.

*Conclusão:*
Comprar *${whatToBuy} (${whatToBuyTicker})* pode ser mais interessante no atual momento.`);
    };

}

/**
 * TAEE11
1 TAEE11 = 1 TAEE3 + 2 TAEE4

Cotações: 
TAEE11: R$ 35,33
TAEE3: R$ 11,82
TAEE4: R$ 11,85

Não há +10% em proventos nas ações PN.

Conclusão:
Comprar ON (TAEE3) pode ser mais interessante no atual momento.
 */

enum TipoAcao {
    ORDINARIA = 'ON',
    PREFERENCIAL = 'PN',
    UNIT = 'UNIT'
}

function getB3UnitInfo(unitName: string): B3UnitInfo {
    const b3Unit = unitsInfo[unitName];
    if (!b3Unit) {
        return undefined;
    }

    return new B3UnitInfo(b3Unit)
}

function getTickerBasedOnStockType(type: TipoAcao, tickerOn: string, tickerPn: string, tickerUnit: string) {
    switch (type) {
        case TipoAcao.ORDINARIA:
            return tickerOn;
        case TipoAcao.PREFERENCIAL:
            return tickerPn;
        case TipoAcao.UNIT:
            return tickerUnit;
    }
}

function normalizeUnitName(unit: string) {
    unit = unit.toUpperCase();
    if (!unit.endsWith('11')) {
        unit += '11';
    }
    return unit;
}