import { _decorator, Component, Prefab, CCInteger, instantiate, Node, Label, Vec3 } from 'cc';
import { PlayerController } from './PlayerController';
const { ccclass, property } = _decorator;

export const BLOCK_SIZE = 40;

enum GameState{
    GS_INIT,
    GS_PLAYING,
    GS_END,
};

enum BlockType {
    BT_NODE,
    BT_STONE,
}

@ccclass('GameManager')
export class GameManager extends Component {

    @property({type: Prefab})
    public boxPrefab: Prefab|null = null;
    @property({type: CCInteger})
    public roadLength: number = 50;
    private _road: BlockType[] = [];

    @property({ type: Node })
    public startMenu: Node | null = null; // 开始的 UI
    @property({ type: PlayerController })
    public playerCtrl: PlayerController | null = null; // 角色控制器
    @property({type: Label})
    public stepsLabel: Label|null = null; // 计步器

    init() {
        if (this.startMenu) {
            this.startMenu.active = true;
        }

        this.generateRoad();

        if (this.playerCtrl) {
            this.playerCtrl.setInputActive(false);
            this.playerCtrl.node.setPosition(Vec3.ZERO);
            this.playerCtrl.reset();
        }
    }

    generateRoad () {
        this.node.removeAllChildren();

        this._road = [];
        this._road.push(BlockType.BT_STONE)

        for (let i = 1; i < this.roadLength; i++) {
            if (this._road[i - 1] === BlockType.BT_NODE) {
                this._road.push(BlockType.BT_STONE);
            } else {
                this._road.push(Math.floor(Math.random() * 2));
            }
        }

        for (let j = 0; j < this._road.length; j++) {
            let block: Node | null = this.spawnBlockByType(this._road[j]);
            if (block) {
                this.node.addChild(block);
                block.setPosition(j * BLOCK_SIZE, 0, 0);
            }
        }
    }

    spawnBlockByType(type: BlockType) {
        if (!this.boxPrefab) {
            return null;
        }

        let block: Node|null = null;
        switch(type) {
            case BlockType.BT_STONE:
                block = instantiate(this.boxPrefab);
                break;
        }

        return block;
    }

    setCurState (value: GameState) {
        switch(value) {
            case GameState.GS_INIT:
                this.init();
                break;
            case GameState.GS_PLAYING:
                this.onPlaying();
                break;
            case GameState.GS_END:
                break;
        }
    }

    onPlaying() {
        if (this.startMenu) {
            this.startMenu.active = false;
        }

        if (this.stepsLabel) {
            this.stepsLabel.string = '0';   // 将步数重置为0
        }

        setTimeout(() => {      //直接设置active会直接开始监听鼠标事件，做了一下延迟处理
            if (this.playerCtrl) {
                this.playerCtrl.setInputActive(true);
            }
        }, 0.1);
    }

    onPlayerJumpEnd(moveIndex: number) {
        if (this.stepsLabel) {
            this.stepsLabel.string = '' + (moveIndex >= this.roadLength ? this.roadLength : moveIndex);
        }
        this.checkResult(moveIndex);
    }

    onStartButtonClicked() {
        this.setCurState(GameState.GS_PLAYING);
    }

    checkResult(moveIndex: number) {
        if (moveIndex < this.roadLength) {
            if (this._road[moveIndex] == BlockType.BT_NODE) {   //跳到了空方块上

                this.setCurState(GameState.GS_INIT)
            }
        } else {    // 跳过了最大长度
            this.setCurState(GameState.GS_INIT);
        }
    }

    start() {
        this.setCurState(GameState.GS_INIT);
        this.playerCtrl?.node.on('JumpEnd', this.onPlayerJumpEnd, this);
    }

    update(deltaTime: number) {

    }
}

