import { Column, DataType, Model, Table } from 'sequelize-typescript';

@Table({ tableName: 'users', underscored: true })
export class User extends Model {
  @Column({
    type: DataType.UUID,
    primaryKey: true,
    defaultValue: DataType.UUIDV4,
  })
  declare id: string;

  @Column({ type: DataType.STRING, allowNull: false, unique: true })
  declare email: string;

  @Column(DataType.STRING)
  declare name: string;

  @Column(DataType.TEXT)
  declare avatarUrl: string;

  @Column({ type: DataType.STRING, unique: true })
  declare googleId: string;
}
