/*
  Warnings:

  - You are about to drop the `Todo` table. If the table is not empty, all the data it contains will be lost.

*/
BEGIN TRY

BEGIN TRAN;

-- DropTable
DROP TABLE [dbo].[Todo];

-- CreateTable
CREATE TABLE [dbo].[Tenants] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(1000) NOT NULL,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [Tenants_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [Tenants_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Users] (
    [id] INT NOT NULL IDENTITY(1,1),
    [tenant_id] INT,
    [role] NVARCHAR(1000) NOT NULL,
    [email] NVARCHAR(1000) NOT NULL,
    [password_hash] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [Users_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [Users_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Users_email_key] UNIQUE NONCLUSTERED ([email])
);

-- CreateTable
CREATE TABLE [dbo].[RefreshTokens] (
    [id] INT NOT NULL IDENTITY(1,1),
    [user_id] INT NOT NULL,
    [token] NVARCHAR(1000) NOT NULL,
    [expires_at] DATETIME2 NOT NULL,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [RefreshTokens_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [RefreshTokens_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [RefreshTokens_token_key] UNIQUE NONCLUSTERED ([token])
);

-- CreateTable
CREATE TABLE [dbo].[PasswordResets] (
    [id] INT NOT NULL IDENTITY(1,1),
    [user_id] INT NOT NULL,
    [token] NVARCHAR(1000) NOT NULL,
    [expires_at] DATETIME2 NOT NULL,
    [used_at] DATETIME2,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [PasswordResets_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [PasswordResets_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [PasswordResets_token_key] UNIQUE NONCLUSTERED ([token])
);

-- CreateTable
CREATE TABLE [dbo].[Todos] (
    [id] INT NOT NULL IDENTITY(1,1),
    [tenant_id] INT NOT NULL,
    [title] NVARCHAR(1000) NOT NULL,
    [completed] BIT NOT NULL CONSTRAINT [Todos_completed_df] DEFAULT 0,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [Todos_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [Todos_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Tags] (
    [id] INT NOT NULL IDENTITY(1,1),
    [tenant_id] INT NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [Tags_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [Tags_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Tags_tenant_id_name_key] UNIQUE NONCLUSTERED ([tenant_id],[name])
);

-- CreateTable
CREATE TABLE [dbo].[TodoTags] (
    [todo_id] INT NOT NULL,
    [tag_id] INT NOT NULL,
    CONSTRAINT [TodoTags_pkey] PRIMARY KEY CLUSTERED ([todo_id],[tag_id])
);

-- AddForeignKey
ALTER TABLE [dbo].[Users] ADD CONSTRAINT [Users_tenant_id_fkey] FOREIGN KEY ([tenant_id]) REFERENCES [dbo].[Tenants]([id]) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[RefreshTokens] ADD CONSTRAINT [RefreshTokens_user_id_fkey] FOREIGN KEY ([user_id]) REFERENCES [dbo].[Users]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[PasswordResets] ADD CONSTRAINT [PasswordResets_user_id_fkey] FOREIGN KEY ([user_id]) REFERENCES [dbo].[Users]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Todos] ADD CONSTRAINT [Todos_tenant_id_fkey] FOREIGN KEY ([tenant_id]) REFERENCES [dbo].[Tenants]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Tags] ADD CONSTRAINT [Tags_tenant_id_fkey] FOREIGN KEY ([tenant_id]) REFERENCES [dbo].[Tenants]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[TodoTags] ADD CONSTRAINT [TodoTags_todo_id_fkey] FOREIGN KEY ([todo_id]) REFERENCES [dbo].[Todos]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[TodoTags] ADD CONSTRAINT [TodoTags_tag_id_fkey] FOREIGN KEY ([tag_id]) REFERENCES [dbo].[Tags]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
