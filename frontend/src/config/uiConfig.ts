import { tasksEnum } from "../constants";
import MapSvg from "../assets/map/Map.svg";
import QuestBackground from "../assets/background/Quest_background.svg";
import zeroStep from "../assets/steps/zero.svg";
import firstStep from "../assets/steps/1.svg";
import secondStep from "../assets/steps/2.svg";
import thirdStep from "../assets/steps/3.svg";
import fourthStep from "../assets/steps/4.svg";
import fifthStep from "../assets/steps/5.svg";
import sixthStep from "../assets/steps/6.svg";
import seventhStep from "../assets/steps/7.svg";
import eightsStep from "../assets/steps/8.svg";
import ninethStep from "../assets/steps/9.svg";
import tensStep from "../assets/steps/10.svg";
import elevensStep from "../assets/steps/11.svg";
import twelvesStep from "../assets/steps/12.svg";
import thirteensStep from "../assets/steps/13.svg";
import fourteensStep from "../assets/steps/14.svg";
import Star from "../assets/star/Star.svg";
import Cloud from "../assets/clouds/Cloud.svg";
import GirlSvg from "../assets/girl-with-shadow/Girl.svg";
import Shadow from "../assets/girl-with-shadow/Shadow.svg";
import FinishScreenSVG from "../assets/finish-screens/Finish_screen.svg";
import DzenScreenSVG from "../assets/finish-screens/Dzen_screen.svg";
import PurpleStepShadow from "../assets/pointers-shadow/Purple.svg";
import GreenStepShadow from "../assets/pointers-shadow/Green.svg";
import zero_red from "../assets/pointers/red/zero.svg";
import one_red from "../assets/pointers/red/one.svg";
import two_red from "../assets/pointers/red/two.svg";
import three_red from "../assets/pointers/red/three.svg";
import zero_yellow from "../assets/pointers/yellow/zero.svg";
import one_yellow from "../assets/pointers/yellow/one.svg";
import two_yellow from "../assets/pointers/yellow/two.svg";
import three_yellow from "../assets/pointers/yellow/three.svg";
import zero_cyan from "../assets/pointers/cyan/zero.svg";
import one_cyan from "../assets/pointers/cyan/one.svg";
import two_cyan from "../assets/pointers/cyan/two.svg";
import three_cyan from "../assets/pointers/cyan/three.svg";
import zero_green from "../assets/pointers/green/zero.svg";
import one_green from "../assets/pointers/green/one.svg";
import two_green from "../assets/pointers/green/two.svg";
import three_green from "../assets/pointers/green/three.svg";
import zero_orange from "../assets/pointers/orange/zero.svg";
import one_orange from "../assets/pointers/orange/one.svg";
import two_orange from "../assets/pointers/orange/two.svg";
import three_orange from "../assets/pointers/orange/three.svg";
import zero_purple from "../assets/pointers/purple/zero.svg";
import one_purple from "../assets/pointers/purple/one.svg";
import two_purple from "../assets/pointers/purple/two.svg";
import three_purple from "../assets/pointers/purple/three.svg";
export interface TaskPositionConfig {
    taskTitle: tasksEnum;
    taskNumber: number;
    cxPointers: number;
    cyPointers: number;
    cxStep: number;
    cyStep: number;
}
export interface StarConfig {
    top: string;
    left: string;
    height: string;
    width: string;
    duration: number;
}
export interface CloudConfig {
    top: string;
    left: string;
    height: string;
    width: string;
    duration: number;
    translateFrom: string;
    translateTo: string;
}
export interface CharacterConfig {
    image: string;
    shadow: string;
    position: {
        left: string;
        top: string;
        height: string;
    };
    shadowPosition: {
        left: string;
        top: string;
        height: string;
    };
    animation: {
        translateFrom: string;
        translateTo: string;
        duration: number;
    };
    shadowAnimation: {
        scaleFrom: number;
        scaleTo: number;
        duration: number;
    };
}
export interface FinishScreenConfig {
    finish: string;
    dzen: string;
}
export interface UIConfig {
    map: {
        background: string;
        mapSvg: string;
    };
    steps: {
        images: string[];
        shadow: {
            green: string;
            purple: string;
            greenThreshold: number;
        };
    };
    taskPositions: TaskPositionConfig[];
    animations: {
        stars: StarConfig[];
        clouds: CloudConfig[];
        character: CharacterConfig;
    };
    finishScreens: FinishScreenConfig;
    pointers: {
        colored: string[][];
        maxVisibleInTooltip: number;
        maxBeforeModal: number;
    };
    avatar: {
        fallbackUrl?: string;
    };
}
export const uiConfig: UIConfig = {
    map: {
        background: QuestBackground,
        mapSvg: MapSvg,
    },
    steps: {
        images: [
            zeroStep,
            firstStep,
            secondStep,
            thirdStep,
            fourthStep,
            fifthStep,
            sixthStep,
            seventhStep,
            eightsStep,
            ninethStep,
            tensStep,
            elevensStep,
            twelvesStep,
            thirteensStep,
            fourteensStep,
        ],
        shadow: {
            green: GreenStepShadow,
            purple: PurpleStepShadow,
            greenThreshold: 10,
        },
    },
    taskPositions: [
        {
            taskTitle: tasksEnum.initialPosition,
            taskNumber: 0,
            cxPointers: 15.8,
            cyPointers: 21,
            cxStep: 16.5,
            cyStep: 32.5,
        },
        {
            taskTitle: tasksEnum.todoList,
            taskNumber: 1,
            cxPointers: 20.8,
            cyPointers: 33.5,
            cxStep: 21.5,
            cyStep: 43.5,
        },
        {
            taskTitle: tasksEnum.taskFromList,
            taskNumber: 2,
            cxPointers: 19.2,
            cyPointers: 64,
            cxStep: 20,
            cyStep: 74,
        },
        {
            taskTitle: tasksEnum.freshAirWalk,
            taskNumber: 3,
            cxPointers: 27.7,
            cyPointers: 69,
            cxStep: 28.5,
            cyStep: 79,
        },
        {
            taskTitle: tasksEnum.gratitudeList,
            taskNumber: 4,
            cxPointers: 44.2,
            cyPointers: 55.5,
            cxStep: 45,
            cyStep: 65.5,
        },
        {
            taskTitle: tasksEnum.goodDeed,
            taskNumber: 5,
            cxPointers: 39,
            cyPointers: 41.2,
            cxStep: 40,
            cyStep: 50.8,
        },
        {
            taskTitle: tasksEnum.goodDeed,
            taskNumber: 6,
            cxPointers: 32.8,
            cyPointers: 31,
            cxStep: 33.5,
            cyStep: 41,
        },
        {
            taskTitle: tasksEnum.goodDeed,
            taskNumber: 7,
            cxPointers: 36,
            cyPointers: 15,
            cxStep: 36.7,
            cyStep: 25,
        },
        {
            taskTitle: tasksEnum.goodDeed,
            taskNumber: 8,
            cxPointers: 54.6,
            cyPointers: 15.5,
            cxStep: 55.5,
            cyStep: 25.5,
        },
        {
            taskTitle: tasksEnum.goodDeed,
            taskNumber: 9,
            cxPointers: 58.7,
            cyPointers: 30.5,
            cxStep: 59.5,
            cyStep: 40.5,
        },
        {
            taskTitle: tasksEnum.goodDeed,
            taskNumber: 10,
            cxPointers: 53.1,
            cyPointers: 53.2,
            cxStep: 54,
            cyStep: 63,
        },
        {
            taskTitle: tasksEnum.goodDeed,
            taskNumber: 11,
            cxPointers: 60.2,
            cyPointers: 64,
            cxStep: 61,
            cyStep: 74,
        },
        {
            taskTitle: tasksEnum.goodDeed,
            taskNumber: 12,
            cxPointers: 73.6,
            cyPointers: 60.5,
            cxStep: 74.5,
            cyStep: 70.5,
        },
        {
            taskTitle: tasksEnum.goodDeed,
            taskNumber: 13,
            cxPointers: 74.7,
            cyPointers: 44.5,
            cxStep: 75.5,
            cyStep: 54.5,
        },
        {
            taskTitle: tasksEnum.goodDeed,
            taskNumber: 14,
            cxPointers: 71.3,
            cyPointers: 29,
            cxStep: 72,
            cyStep: 39,
        },
    ],
    animations: {
        stars: [
            { top: "80%", left: "60%", height: "3%", width: "3%", duration: 1.2 },
            { top: "78%", left: "81%", height: "3%", width: "3%", duration: 1.2 },
            { top: "44%", left: "90%", height: "3%", width: "3%", duration: 1.2 },
            { top: "87%", left: "67%", height: "2%", width: "2%", duration: 0.7 },
            { top: "87%", left: "91%", height: "2%", width: "2%", duration: 0.7 },
            { top: "45%", left: "77%", height: "2%", width: "2%", duration: 0.7 },
            { top: "86%", left: "72%", height: "2.5%", width: "2.5%", duration: 1 },
            { top: "64%", left: "88%", height: "2.5%", width: "2.5%", duration: 1 },
            { top: "34%", left: "90%", height: "2.5%", width: "2.5%", duration: 1 },
            { top: "69%", left: "84%", height: "4%", width: "4%", duration: 1 },
        ],
        clouds: [
            {
                top: "25%",
                left: "70%",
                height: "5%",
                width: "5%",
                duration: 5,
                translateFrom: "-40%",
                translateTo: "20%",
            },
            {
                top: "20%",
                left: "60%",
                height: "7%",
                width: "7%",
                duration: 7,
                translateFrom: "-40%",
                translateTo: "20%",
            },
            {
                top: "30%",
                left: "25%",
                height: "6%",
                width: "6%",
                duration: 9,
                translateFrom: "-30%",
                translateTo: "30%",
            },
            {
                top: "42%",
                left: "13%",
                height: "8%",
                width: "8%",
                duration: 8,
                translateFrom: "-40%",
                translateTo: "20%",
            },
        ],
        character: {
            image: GirlSvg,
            shadow: Shadow,
            position: {
                left: "79.3%",
                top: "28%",
                height: "15%",
            },
            shadowPosition: {
                left: "81%",
                top: "37%",
                height: "2%",
            },
            animation: {
                translateFrom: "-45%",
                translateTo: "-40%",
                duration: 4,
            },
            shadowAnimation: {
                scaleFrom: 0.8,
                scaleTo: 1.2,
                duration: 4,
            },
        },
    },
    finishScreens: {
        finish: FinishScreenSVG,
        dzen: DzenScreenSVG,
    },
    pointers: {
        colored: [
            [zero_red, zero_yellow, zero_cyan, zero_green, zero_orange, zero_purple],
            [one_red, one_yellow, one_cyan, one_green, one_orange, one_purple],
            [two_red, two_yellow, two_cyan, two_green, two_orange, two_purple],
            [three_red, three_yellow, three_cyan, three_green, three_orange, three_purple],
        ],
        maxVisibleInTooltip: 5,
        maxBeforeModal: 5,
    },
    avatar: {
        fallbackUrl: undefined,
    },
};
export const getStarImage = () => Star;
export const getCloudImage = () => Cloud;
