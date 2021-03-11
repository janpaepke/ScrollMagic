import { Container, ContainerElement } from './Container';
import { Scene } from './Scene';

export class ContainerManager {
	private static cache = new Map<ContainerElement, [Container, Set<Scene>]>();

	private element?: ContainerElement;
	constructor(private readonly scene: Scene) {}
	public attach(containerElement: ContainerElement): Container {
		if (undefined !== this.element) {
			this.detach(); // TODO: should we auto detach or throw?
		}
		this.element = containerElement;
		let cache = ContainerManager.cache.get(containerElement);
		if (undefined === cache) {
			cache = [new Container(containerElement), new Set()];
			ContainerManager.cache.set(containerElement, cache);
		}
		const [container, scenes] = cache;
		scenes.add(this.scene);
		return container;
	}
	public detach(): void {
		if (undefined === this.element) {
			return;
		}
		const cache = ContainerManager.cache.get(this.element);
		if (undefined === cache) {
			return;
		}
		const [container, scenes] = cache;
		scenes.delete(this.scene);
		if (scenes.size === 0) {
			// no more attached scenes
			container.destroy();
			ContainerManager.cache.delete(this.element);
		}
		this.element = undefined;
	}

	public get container(): Container {
		// TODO: there should be no need to get, we should add listeners directly
		if (undefined === this.element) {
			throw new Error('scene is not yet attached to a container...');
		}
		const [container] = ContainerManager.cache.get(this.element)!;
		return container;
	}
}
