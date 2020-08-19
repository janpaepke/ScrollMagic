interface ScrollMagicOptions {
	test: boolean;
}

export class ScrollMagic {
	constructor({ test = true }: ScrollMagicOptions) {
		if (test) console.log('init');
	}
}
