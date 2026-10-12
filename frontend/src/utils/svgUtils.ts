export async function isCircularSVG(iconUrl: string): Promise<boolean> {
    try {
        if (iconUrl.startsWith('data:')) {
            if (iconUrl.startsWith('data:image/svg+xml')) {
                const decoded = decodeURIComponent(iconUrl.split(',')[1] || '');
                return checkSVGContent(decoded);
            }
            return false;
        }
        if (!iconUrl.toLowerCase().endsWith('.svg')) {
            return false;
        }
        const response = await fetch(iconUrl);
        if (!response.ok) {
            return false;
        }
        const svgText = await response.text();
        return checkSVGContent(svgText);
    }
    catch {
        return false;
    }
}
function checkSVGContent(svgContent: string): boolean {
    try {
        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(svgContent, 'image/svg+xml');
        const svgElement = svgDoc.querySelector('svg');
        if (!svgElement) {
            return false;
        }
        const viewBox = svgElement.getAttribute('viewBox');
        if (viewBox) {
            const [width, height] = viewBox.split(' ').map(Number);
            const isSquare = Math.abs(width - height) < 0.01;
            const hasCircle = svgElement.querySelector('circle') !== null;
            if (isSquare && hasCircle) {
                const circles = svgElement.querySelectorAll('circle');
                for (const circle of circles) {
                    const cx = parseFloat(circle.getAttribute('cx') || '0');
                    const cy = parseFloat(circle.getAttribute('cy') || '0');
                    const r = parseFloat(circle.getAttribute('r') || '0');
                    const centerX = width / 2;
                    const centerY = height / 2;
                    const isCentered = Math.abs(cx - centerX) < width * 0.05 && Math.abs(cy - centerY) < height * 0.05;
                    const isLarge = r > Math.min(width, height) * 0.3;
                    if (isCentered && isLarge) {
                        return true;
                    }
                }
            }
        }
        const width = svgElement.getAttribute('width');
        const height = svgElement.getAttribute('height');
        if (width && height) {
            const widthNum = parseFloat(width);
            const heightNum = parseFloat(height);
            const isSquare = Math.abs(widthNum - heightNum) < 0.01;
            if (isSquare && svgElement.querySelector('circle')) {
                return true;
            }
        }
        return false;
    }
    catch {
        return false;
    }
}
