export const calcAvatarPositionAndSize = (totalCount: number) => {
    switch (true) {
        case totalCount === 3:
            return { marginTop: "19.5%", width: "15%" };
        case totalCount === 4:
            return { marginTop: "21.5%", width: "12%" };
        case totalCount === 5:
            return { marginTop: "23.2%", width: "9%" };
        case totalCount > 5 && totalCount <= 10:
            return { marginTop: "8.7%", width: "9%" };
        case totalCount > 10 && totalCount <= 15:
            return { marginTop: "5%", width: "7%" };
        case totalCount > 15 && totalCount <= 20:
            return { marginTop: "4%", width: "5.1%" };
        case totalCount > 20 && totalCount <= 25:
            return { marginTop: "3.2%", width: "4.2%" };
        case totalCount > 25 && totalCount <= 30:
            return { marginTop: "2.5%", width: "3.5%" };
    }
};
