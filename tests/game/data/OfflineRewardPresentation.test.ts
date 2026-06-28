import { UserData } from "../../../assets/Scripts/Game/Data/UserData";
import { OfflineRewardPresentation } from "../../../assets/Scripts/Menu/OfflineRewardPresentation";

test("OfflineRewardPresentation hides the claim action when there is no pending gold", () => {
    const userData = new UserData();
    userData.game.offlineGold = 0;
    userData.game.idleRate = 1;

    const presentation = OfflineRewardPresentation.build(userData);

    expect(presentation.isVisible).toBe(false);
    expect(presentation.buttonLabel).toBe("Gold: None");
    expect(presentation.summary).toBe("No gold waiting");
});

test("OfflineRewardPresentation summarizes pending gold and rate", () => {
    const userData = new UserData();
    userData.game.offlineGold = 125.8;
    userData.game.idleRate = 1.5;

    const presentation = OfflineRewardPresentation.build(userData);

    expect(presentation.isVisible).toBe(true);
    expect(presentation.buttonLabel).toBe("Claim gold: 125");
    expect(presentation.summary).toBe("Gold waiting: 125 | Rate: 1.5x");
});
