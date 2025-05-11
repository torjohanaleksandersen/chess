import { Avataaars } from "./imports/avataaars.js";





export class Avatar {
    constructor() {
        this.Avataaars = Avataaars;

        this.traits = ["width", "height", "style", "background", 
            "skin", "top", "hairColor", "hatColor", "accessories", 
            "accessoriesColor", "facialHair", "facialHairColor", "clothing", 
            "clothingGraphic", "clothingColor", "eyes", "eyebrows", "mouth"
        ];

        this.options = {};
    }

    getRandomOptions() {
        const options = {
            skin: ["tanned", "yellow", "pale", "light", "brown", "darkBrown", "black"],
            top: ["dreads01", "dreads02", "frizzle", "shaggyMullet", "shaggy", "shortCurly", "shortFlat", "shortRound", "sides", "shortWaved", "theCaesarAndSidePart", "theCaesar", "bigHair", "bob", "bun", "curly", "curvy", "dreads", "frida", "froAndBand", "fro", "longButNotTooLong", "miaWallace", "shavedSides", "straightAndStrand", "straight01", "straight02", "eyepatch", "turban", "hijab", "hat", "winterHat01", "winterHat02", "winterHat03", "winterHat04"],
            hairColor: ["auburn", "black", "blonde", "blondeGolden", "brown", "brownDark", "pastelPink", "platinum", "red", "silverGray"],
            hatColor: ["black", "blue01", "blue02", "blue03", "gray01", "gray02", "heather", "pastelBlue", "pastelGreen", "pastelOrange", "pastelRed", "pastelYellow", "pink", "red", "white"],
            accessories: ["none", "kurt", "prescription01", "prescription02", "round", "sunglasses", "wayfarers"],
            accessoriesColor: ["black", "blue01", "blue02", "blue03", "gray01", "gray02", "heather", "pastelBlue", "pastelGreen", "pastelOrange", "pastelRed", "pastelYellow", "pink", "red", "white"],
            facialHair: ["none", "beardLight", "beardMagestic", "beardMedium", "moustaceFancy", "moustacheMagnum"],
            facialHairColor: ["auburn", "black", "blonde", "blondeGolden", "brown", "brownDark", "pastelPink", "platinum", "red", "silverGray"],
            clothing: ["blazerAndShirt", "blazerAndSweater", "collarAndSweater", "graphicShirt", "hoodie", "overall", "shirtCrewNeck", "shirtScoopNeck", "shirtVNeck"],
            clothingGraphic: ["skrullOutline", "skrull", "resist", "pizza", "hola", "diamond", "deer", "dumbia", "bear", "bat"],
            clothingColor: ["auburn", "black", "blonde", "blondeGolden", "brown", "brownDark", "pastelPink", "platinum", "red", "silverGray"],
            eyes: ["squint", "closed", "cry", "default", "eyeRoll", "happy", "hearts", "side", "surprised", "wink", "winkWacky", "xDizzy"],
            eyebrows: ["angryNatural", "defaultNatural", "flatNatural", "frownNatural", "raisedExcitedNatural", "sadConcernedNatural", "unibrowNatural", "upDownNatural", "raisedExcited", "angry", "default", "sadConcerned", "upDown"],
            mouth: ["concerned", "default", "disbelief", "eating", "grimace", "sad", "screamOpen", "serious", "smile", "tongue", "twinkle", "vomit"]
        }

        const randomOptions = {};


        for (const trait in options) {
            randomOptions[trait] = options[trait][Math.floor(Math.random() * options[trait].length)];
        
            randomOptions.background = `rgb(${Math.floor(Math.random() * 256)},${Math.floor(Math.random() * 256)},${Math.floor(Math.random() * 256)})`;
        }

        return randomOptions;
    }

    createRandom() {
        const randomOptions = this.getRandomOptions();
        this.options = randomOptions;
        
        return this.Avataaars.create(randomOptions);
    }
}