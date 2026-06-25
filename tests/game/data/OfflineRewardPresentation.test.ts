import { UserData } from "../../../assets/Scripts/Game/Data/UserData";
import { OfflineRewardPresentation } from "../../../assets/Scripts/Menu/OfflineRewardPresentation";

test("OfflineRewardPresentation hides the claim action when there is no idle gold", () => {
    const userData = new UserData();
    userData.game.offlineGold = 0;
    userData.game.idleRate = 1;

    const presentation = OfflineRewardPresentation.build(userData);

    expect(presentation.isVisible).toBe(false);
    expect(presentation.buttonLabel).toBe("Idle gold: None");
    expect(presentation.summary).toBe("No idle gold waiting");
});

test("OfflineRewardPresentation summarizes pending idle gold and rate", () => {
    const userData = new UserData();
    userData.game.offlineGold = 125.8;
    userData.game.idleRate = 1.5;

    const presentation = OfflineRewardPresentation.build(userData);

    expect(presentation.isVisible).toBe(true);
    expect(presentation.buttonLabel).toBe("Claim idle gold: 125");
    expect(presentation.summary).toBe("Idle earnings waiting: 125 gold | Rate: 1.5x");
});
