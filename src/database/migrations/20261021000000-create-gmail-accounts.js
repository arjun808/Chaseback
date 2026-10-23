'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('gmail_accounts', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      google_email: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      refresh_token_enc: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      scopes: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: [],
      },
      history_id: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      last_synced_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      status: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'active',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
    });

    await queryInterface.addIndex('gmail_accounts', ['user_id']);
    await queryInterface.addIndex('gmail_accounts', ['google_email']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('gmail_accounts');
  },
};
