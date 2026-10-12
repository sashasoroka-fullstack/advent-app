export const calcPointerHoverPosition = (index: number, parentDivWidth: number, totalCount: number) => {
    switch (true) {
        case totalCount === 2: {
            const coordsShift = index - 0.5;
            return {
                left: `${coordsShift * parentDivWidth * 1.5}px`,
                borderRadius: 5,
            };
        }
        case totalCount === 3: {
            const coordsShift = index - 1;
            return {
                left: `${coordsShift * parentDivWidth * 1.3}px`,
                borderRadius: 5,
            };
        }
        case totalCount === 4: {
            const coordsShift = index - 1.5;
            return {
                left: `${coordsShift * parentDivWidth * 1.3}px`,
                borderRadius: 5,
            };
        }
        case totalCount === 5: {
            const coordsShift = index - 2;
            return {
                left: `${coordsShift * parentDivWidth * 1.2}px`,
                borderRadius: 5,
            };
        }
    }
};
