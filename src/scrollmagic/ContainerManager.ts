import { Container, ContainerElement } from './Container';
import { Scene } from './Scene';

export class ContainerManager {
	private static containers = new Map<ContainerElement, Container>(); // TODO: this is a 1:1 relationship. does a map make sense?
	private static attachments = new Map<Scene, Container>();

	// attaches a scene to a container, creates a new one, if none exists for this scroll element.
	static attach(scene: Scene, containerElement: ContainerElement): Container {
		if (this.attachments.has(scene)) {
			this.detach(scene);
		}
		let container = ContainerManager.containers.get(containerElement);
		if (undefined === container) {
			container = new Container(containerElement);
			ContainerManager.containers.set(containerElement, container);
		}
		this.attachments.set(scene, container);
		return container;
	}

	// detaches a scene from its container, destroys the container if no more scenes are attached to it.
	static detach(scene: Scene): void {
		const attachedContainer = this.attachments.get(scene);
		if (undefined === attachedContainer) {
			throw new Error('detach called on unknown scene');
		}
		this.attachments.delete(scene);
		const noMoreSiblings = false === [...this.attachments.values()].includes(attachedContainer);
		if (noMoreSiblings) {
			this.containers.forEach((container, key) => {
				// TODO: there should only be one element per container, so does this make sense?
				if (container === attachedContainer) {
					container.destroy();
					this.containers.delete(key);
				}
			});
		}
	}
}
