import { PowerUp } from "./power_up";
import { MissionElementItem } from "../parsing/mis_parser";
import { state } from "../state";

export class TimeTravel extends PowerUp {
	dtsPath = "shapes/items/timetravel.dts";
	cooldownDuration = Infinity;
	autoUse = true;
	timeBonus = 5000;

	constructor(element: MissionElementItem) {
		super();

		if (element.timeBonus) {
			this.timeBonus = Number(element.timeBonus);
		}

		this.pickUpName = `${this.timeBonus/1000} second Time Travel bonus`;
	}

	pickUp() {
		return true;
	}

	use() {
		state.currentLevel.addTimeTravelBonus(this.timeBonus);
	}
}