-- AlterTable
ALTER TABLE `global_exercises` ADD COLUMN `user_admin_id` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `global_exercises` ADD CONSTRAINT `global_exercises_user_admin_id_fkey` FOREIGN KEY (`user_admin_id`) REFERENCES `users_admin`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
