import { Link } from "react-scroll";
import "./GameButton.css";
export const GameButton = () => {
    return (<Link to="quest-map" spy={true} smooth={true} duration={500} className="game-button-container">
      <button className="game-button">Game</button>
    </Link>);
};
