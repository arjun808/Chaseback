import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { User } from '../model/user.model';

@Table({ tableName: 'gmail_accounts', underscored: true })
export class GmailAccount extends Model {
  @Column({
    type: DataType.UUID,
    primaryKey: true,
    defaultValue: DataType.UUIDV4,
  })
  declare id: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  declare userId: string;

  @BelongsTo(() => User)
  declare user: User;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare googleEmail: string;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  declare refreshTokenEnc: string;

  @Column({
    type: DataType.JSONB,
    allowNull: true,
    defaultValue: [],
  })
  declare scopes: string[];

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare historyId: string | null;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  declare lastSyncedAt: Date | null;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    defaultValue: 'active',
  })
  declare status: string;
}
