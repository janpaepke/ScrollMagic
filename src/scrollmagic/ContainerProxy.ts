import { Container, ContainerEvent, ScrollParent } from './Container';
import { ScrollMagic } from './ScrollMagic';
import { failWithInternal } from './ScrollMagicError';

type EventCallback = (e: ContainerEvent) => void;
type CleanUpFunction = () => void;

export class ContainerProxy {
	private static cache = new Map<ScrollParent, [Container, Set<ScrollMagic>]>();

	private container?: Container;
	constructor(private readonly scene: ScrollMagic) {}
	private unsubscribers = new Array<CleanUpFunction>();

	public attach(scrollParent: ScrollParent, onUpdate: EventCallback): void {
		if (undefined !== this.container) {
			this.detach();
		}
		let cache = ContainerProxy.cache.get(scrollParent);
		if (undefined === cache) {
			cache = [new Container(scrollParent), new Set()];
			ContainerProxy.cache.set(scrollParent, cache);
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
		const { scrollParent } = this.container;
		const cache = ContainerProxy.cache.get(scrollParent);
		if (undefined === cache) {
			throw failWithInternal('No cache info for scrollParent');
		}
		const [container, scenes] = cache;
		scenes.delete(this.scene);
		this.unsubscribers.forEach(unsubscribe => unsubscribe());
		this.unsubscribers = [];
		if (scenes.size === 0) {
			// no more attached scenes
			container.destroy();
			ContainerProxy.cache.delete(scrollParent);
		}
		this.container = undefined;
	}

	public get size(): Container['size'] {
		if (undefined === this.container) {
			throw failWithInternal(`Can't get size when not attached to a container`);
		}
		return this.container.size;
	}
}
