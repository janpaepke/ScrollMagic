import { Container, type ContainerEvent, type ScrollContainer } from './Container';
import { ScrollMagic } from './ScrollMagic';
import { ScrollMagicInternalError } from './ScrollMagicError';
type EventCallback = (e: ContainerEvent) => void;
type CleanUpFunction = () => void;
type Velocity = {
	x: number;
	y: number;
};

export class ContainerProxy {
	private static cache = new WeakMap<ScrollContainer, [Container, Set<ScrollMagic>]>();

	private container?: Container;
	constructor(private readonly scene: ScrollMagic) {}
	private unsubscribers: CleanUpFunction[] = [];

	public attach(containerElement: ScrollContainer, onUpdate: EventCallback): void {
		if (undefined !== this.container) {
			this.detach();
		}
		let cache = ContainerProxy.cache.get(containerElement);
		if (undefined === cache) {
			cache = [new Container(containerElement), new Set()];
			ContainerProxy.cache.set(containerElement, cache);
		}
		const [container, scenes] = cache;
		scenes.add(this.scene);
		this.container = container;
		this.unsubscribers = [container.subscribe('resize', onUpdate), container.subscribe('scroll', onUpdate)];
	}

	public detach(): void {
		if (undefined === this.container) {
			return;
		}
		const { containerElement } = this.container;
		const cache = ContainerProxy.cache.get(containerElement);
		if (undefined === cache) {
			throw new ScrollMagicInternalError('No cache info for container');
		}
		const [container, scenes] = cache;
		scenes.delete(this.scene);
		this.unsubscribers.forEach(unsubscribe => unsubscribe());
		this.unsubscribers = [];
		if (scenes.size === 0) {
			// no more attached scenes
			container.destroy();
			ContainerProxy.cache.delete(containerElement);
		}
		this.container = undefined;
	}

	public get rect(): Container['size'] & Container['position'] {
		if (undefined === this.container) {
			throw new ScrollMagicInternalError(`Can't get size when not attached to a container`);
		}
		return {
			...this.container.position,
			...this.container.size,
		};
	}

	public get scrollVelocity(): Velocity {
		if (undefined === this.container) {
			return { x: 0, y: 0 };
		}
		return this.container.scrollVelocity;
	}
}
