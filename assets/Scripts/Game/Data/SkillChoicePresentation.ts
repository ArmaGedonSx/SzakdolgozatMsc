import { SkillChoiceSettings } from "./SkillChoiceSettings";

export interface SkillChoicePresentationData {
    title: string;
    description: string;
}

export class SkillChoicePresentation {
    public static build(choice: SkillChoiceSettings): SkillChoicePresentationData {
        const lines = [this.formatDescription(choice.description), `Rank ${choice.currentRank}/${choice.maxRank}`];
        const costLine = this.formatCostLine(choice);
        if (costLine) {
            lines.push(costLine);
        }

        return {
            title: `${choice.name}\nLv ${choice.nextRank}/${choice.maxRank}`,
            description: lines.join("\n")
        };
    }

    private static formatDescription(description: string): string {
        return description
            .replace(/\bImprove\b/gi, "Boost")
            .replace(/\bIncrease\b/gi, "Boost")
            .replace(/\bCurrent rank\b/gi, "Rank")
            .replace(/\.$/, "")
            .trim();
    }

    private static formatCostLine(choice: SkillChoiceSettings): string {
        const costs: string[] = [];
        if (0 < choice.goldCoinCost) {
            costs.push(`${choice.goldCoinCost} gold`);
        }

        for (const [materialId, quantity] of Object.entries(choice.materialCosts ?? {})) {
            if (quantity <= 0) continue;

            costs.push(`${this.formatMaterialName(materialId)} x${quantity}`);
        }

        return costs.length > 0 ? `Cost: ${costs.join(", ")}` : "";
    }

    private static formatMaterialName(materialId: string): string {
        return materialId
            .replace(/^mat_/, "")
            .split("_")
            .filter((part) => part.length > 0)
            .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
            .join(" ");
    }
}
