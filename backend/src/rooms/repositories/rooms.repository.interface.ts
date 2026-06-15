export interface Room {
  id: string;
  name: string;
  description?: string;
  hostUid: string;
  hostUsername: string;
  isActive: boolean;
  participantCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IRoomsRepository {
  create(room: Omit<Room, 'createdAt' | 'updatedAt'>): Promise<Room>;
  findByHost(hostUid: string): Promise<Room[]>;
  findById(id: string): Promise<Room | null>;
  update(id: string, updates: { name: string }): Promise<Room>;
  delete(id: string): Promise<void>;
}

export const ROOMS_REPOSITORY = Symbol('IRoomsRepository');
