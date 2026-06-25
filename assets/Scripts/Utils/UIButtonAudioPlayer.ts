import { Component, _decorator } from "cc";
import { AppRoot } from "../AppRoot/AppRoot";
import { UIButton } from "../Services/UI/Button/UIButton";
const { ccclass, property } = _decorator;

@ccclass("UIButtonAudioPlayer")
export class UIButtonAudioPlayer extends Component {
    @property(UIButton) private button: UIButton;
    public start(): void {
        this.button.InteractedEvent.on(this.playButtonClick, this);
    }

    private playButtonClick(): void {
        const gameAssets = AppRoot.Instance?.GameAssets;
        const audioClip = gameAssets?.AudioAssets?.buttonClick;
        if (!audioClip) {
            return;
        }
        AppRoot.Instance.AudioPlayer.playSound(audioClip);
    }
}
