import { createHash, randomUUID } from "node:crypto";
import mysql, {
  type Pool,
  type PoolConnection,
  type ResultSetHeader,
  type RowDataPacket,
} from "mysql2/promise";
import type {
  Animal,
  CandleStat,
  MemorialCommentRecord,
  ObservationRecord,
  ProfileStats,
  PublicMemoryRecord,
  Species,
  User,
} from "../src/types";
import { hashPassword, verifyPassword } from "./security";
import {
  submissionStatusLabel,
  type AdminStats,
  type CollaborationTask,
  type ReviewInput,
  type ReviewLog,
  type Store,
  type SubmissionRecord,
  type SubmissionStatus,
  type SubmissionType,
  type UserUpdateInput,
  type WechatProfileInput,
  type WechatUserInput,
} from "./store-types";

export const MYSQL_SCHEMA = [
  `CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    username VARCHAR(80) NULL UNIQUE,
    password_hash VARCHAR(255) NULL,
    wechat_openid VARCHAR(128) NULL UNIQUE,
    wechat_unionid VARCHAR(128) NULL,
    nickname VARCHAR(120) NOT NULL,
    avatar_url TEXT NOT NULL,
    role ENUM('guest','contributor','reviewer','admin') NOT NULL DEFAULT 'contributor',
    status ENUM('active','pending','suspended') NOT NULL DEFAULT 'active',
    agreement_accepted_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_login_at DATETIME NULL,
    INDEX idx_users_role_status (role, status)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS species (
    id VARCHAR(80) PRIMARY KEY,
    chinese_name VARCHAR(160) NOT NULL,
    english_name VARCHAR(160) NOT NULL,
    latin_name VARCHAR(180) NOT NULL,
    data_json JSON NOT NULL,
    published TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FULLTEXT KEY ft_species_names (chinese_name, english_name, latin_name)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS animals (
    id VARCHAR(80) PRIMARY KEY,
    name VARCHAR(160) NOT NULL,
    nickname VARCHAR(160) NOT NULL DEFAULT '',
    species_code VARCHAR(80) NOT NULL DEFAULT '',
    species_name VARCHAR(160) NOT NULL DEFAULT '',
    status VARCHAR(40) NOT NULL,
    institution VARCHAR(180) NOT NULL DEFAULT '',
    city VARCHAR(120) NOT NULL DEFAULT '',
    image_url TEXT NOT NULL,
    summary TEXT NOT NULL,
    data_json JSON NOT NULL,
    published TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_animals_status (status),
    INDEX idx_animals_species (species_code),
    FULLTEXT KEY ft_animals_search (name, nickname, species_name, institution, city)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS submissions (
    id VARCHAR(80) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    type ENUM('recommend','observation','memory','correction','archive','task') NOT NULL,
    animal_id VARCHAR(80) NULL,
    animal_name VARCHAR(160) NOT NULL DEFAULT '',
    title VARCHAR(255) NOT NULL,
    details TEXT NOT NULL,
    payload_json JSON NOT NULL,
    media_url TEXT NULL,
    source_text TEXT NULL,
    copyright_text TEXT NULL,
    status ENUM('pending','approved','need_supplement','rejected') NOT NULL DEFAULT 'pending',
    admin_comment TEXT NOT NULL,
    reviewer_id VARCHAR(64) NULL,
    submitted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reviewed_at DATETIME NULL,
    INDEX idx_submissions_queue (status, type, submitted_at),
    INDEX idx_submissions_user (user_id, submitted_at),
    CONSTRAINT fk_submissions_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_submissions_reviewer FOREIGN KEY (reviewer_id) REFERENCES users(id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `ALTER TABLE submissions MODIFY COLUMN type ENUM('recommend','observation','memory','correction','archive','task') NOT NULL`,
  `CREATE TABLE IF NOT EXISTS collaboration_tasks (
    id VARCHAR(80) PRIMARY KEY,
    creator_id VARCHAR(64) NULL,
    creator_name VARCHAR(120) NOT NULL,
    animal_id VARCHAR(80) NULL,
    animal_name VARCHAR(160) NOT NULL DEFAULT '',
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    expected_info TEXT NOT NULL,
    reward_label VARCHAR(160) NOT NULL,
    base_contribution_count INT NOT NULL DEFAULT 0,
    status ENUM('active','closed') NOT NULL DEFAULT 'active',
    source_submission_id VARCHAR(80) NULL UNIQUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_tasks_status_created (status, created_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS memories (
    id VARCHAR(80) PRIMARY KEY,
    user_id VARCHAR(64) NULL,
    animal_ids JSON NOT NULL,
    title VARCHAR(255) NOT NULL,
    author_name VARCHAR(120) NOT NULL,
    memory_date VARCHAR(40) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(40) NOT NULL,
    category_label VARCHAR(80) NOT NULL,
    image_url TEXT NULL,
    likes_count INT NOT NULL DEFAULT 0,
    submission_id VARCHAR(80) NULL UNIQUE,
    published TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_memories_published (published, created_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS memory_likes (
    user_id VARCHAR(64) NOT NULL,
    memory_id VARCHAR(80) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, memory_id),
    INDEX idx_memory_likes_memory (memory_id),
    CONSTRAINT fk_memory_likes_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_memory_likes_memory FOREIGN KEY (memory_id) REFERENCES memories(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS memorial_comments (
    id VARCHAR(80) PRIMARY KEY,
    user_id VARCHAR(64) NULL,
    author_name VARCHAR(120) NOT NULL,
    animal_id VARCHAR(80) NOT NULL,
    content TEXT NOT NULL,
    base_flowers_count INT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_memorial_comments_animal (animal_id, created_at),
    CONSTRAINT fk_memorial_comments_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_memorial_comments_animal FOREIGN KEY (animal_id) REFERENCES animals(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS comment_flowers (
    user_id VARCHAR(64) NOT NULL,
    comment_id VARCHAR(80) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, comment_id),
    INDEX idx_comment_flowers_comment (comment_id),
    CONSTRAINT fk_comment_flowers_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_comment_flowers_comment FOREIGN KEY (comment_id) REFERENCES memorial_comments(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS favorites (
    user_id VARCHAR(64) NOT NULL,
    animal_id VARCHAR(80) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, animal_id),
    CONSTRAINT fk_favorites_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_favorites_animal FOREIGN KEY (animal_id) REFERENCES animals(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS observation_likes (
    user_id VARCHAR(64) NOT NULL,
    animal_id VARCHAR(80) NOT NULL,
    observation_id VARCHAR(80) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, animal_id, observation_id),
    INDEX idx_observation_likes_target (animal_id, observation_id),
    CONSTRAINT fk_observation_likes_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_observation_likes_animal FOREIGN KEY (animal_id) REFERENCES animals(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS candles (
    id VARCHAR(80) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    animal_id VARCHAR(80) NOT NULL,
    lit_date DATE NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_daily_candle (user_id, animal_id, lit_date),
    INDEX idx_candles_animal (animal_id),
    CONSTRAINT fk_candles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_candles_animal FOREIGN KEY (animal_id) REFERENCES animals(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS animal_metrics (
    animal_id VARCHAR(80) PRIMARY KEY,
    candle_base_count INT NOT NULL DEFAULT 0,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_animal_metrics_animal FOREIGN KEY (animal_id) REFERENCES animals(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS media_files (
    id VARCHAR(80) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    size_bytes INT UNSIGNED NOT NULL,
    storage_path VARCHAR(500) NULL,
    public_url TEXT NULL,
    file_data LONGBLOB NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_media_files_user (user_id, created_at),
    CONSTRAINT fk_media_files_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS review_logs (
    id VARCHAR(80) PRIMARY KEY,
    operator_id VARCHAR(64) NOT NULL,
    operator_name VARCHAR(120) NOT NULL,
    action_text TEXT NOT NULL,
    target_type VARCHAR(50) NOT NULL,
    target_id VARCHAR(80) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_review_logs_created (created_at),
    CONSTRAINT fk_review_logs_operator FOREIGN KEY (operator_id) REFERENCES users(id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
];

function parseJson<T>(value: unknown): T {
  if (typeof value === "string") return JSON.parse(value) as T;
  return value as T;
}

function iso(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  return new Date(String(value)).toISOString();
}

function rowToUser(row: RowDataPacket): User {
  return {
    id: row.id,
    nickname: row.nickname,
    avatarUrl: row.avatar_url || "",
    role: row.role,
    status: row.status,
    createdAt: iso(row.created_at),
    lastLoginAt: row.last_login_at ? iso(row.last_login_at) : undefined,
    agreementAcceptedAt: row.agreement_accepted_at ? iso(row.agreement_accepted_at) : undefined,
  };
}

function rowToSubmission(row: RowDataPacket): SubmissionRecord {
  const status = row.status as SubmissionStatus;
  return {
    id: row.id,
    userId: row.user_id,
    submitterName: row.submitter_name || row.nickname || "匿名用户",
    type: row.type,
    animalId: row.animal_id || undefined,
    animalName: row.animal_name || "待确认动物",
    title: row.title,
    details: row.details,
    payload: parseJson<Record<string, unknown>>(row.payload_json),
    mediaUrl: row.media_url || undefined,
    source: row.source_text || undefined,
    copyright: row.copyright_text || undefined,
    status,
    statusLabel: submissionStatusLabel(status),
    adminComment: row.admin_comment,
    submittedAt: iso(row.submitted_at),
    reviewedAt: row.reviewed_at ? iso(row.reviewed_at) : undefined,
    reviewerName: row.reviewer_name || undefined,
  };
}

export class MysqlStore implements Store {
  private pool: Pool;

  constructor() {
    const databaseUrl = process.env.DATABASE_URL;
    this.pool = databaseUrl
      ? mysql.createPool(databaseUrl)
      : mysql.createPool({
          host: process.env.MYSQL_HOST || "127.0.0.1",
          port: Number(process.env.MYSQL_PORT) || 3306,
          user: process.env.MYSQL_USER || "root",
          password: process.env.MYSQL_PASSWORD || "",
          database: process.env.MYSQL_DATABASE || "project_ahang",
          connectionLimit: Number(process.env.MYSQL_CONNECTION_LIMIT) || 10,
          charset: "utf8mb4",
        });
  }

  async initialize(): Promise<void> {
    for (const statement of MYSQL_SCHEMA) await this.pool.query(statement);
    await this.ensureMediaStorageColumns();
    await this.ensureAdmin();
  }

  async close(): Promise<void> {
    await this.pool.end();
  }

  async getUser(id: string): Promise<User | null> {
    const [rows] = await this.pool.query<RowDataPacket[]>("SELECT * FROM users WHERE id = ? LIMIT 1", [id]);
    return rows[0] ? rowToUser(rows[0]) : null;
  }

  async upsertWechatUser(input: WechatUserInput): Promise<User> {
    const stable = createHash("sha256").update(input.openid).digest("hex").slice(0, 24);
    const id = `wechat-${stable}`;
    await this.pool.execute(
      `INSERT INTO users (id, wechat_openid, wechat_unionid, nickname, avatar_url, role, status, last_login_at)
       VALUES (?, ?, ?, ?, ?, 'contributor', 'active', NOW())
       ON DUPLICATE KEY UPDATE
         wechat_unionid = COALESCE(VALUES(wechat_unionid), wechat_unionid),
         nickname = IF(VALUES(nickname) = '', nickname, VALUES(nickname)),
         avatar_url = IF(VALUES(avatar_url) = '', avatar_url, VALUES(avatar_url)),
         last_login_at = NOW()`,
      [id, input.openid, input.unionid || null, input.nickname || "微信用户", input.avatarUrl || ""],
    );
    const [rows] = await this.pool.query<RowDataPacket[]>("SELECT * FROM users WHERE wechat_openid = ? LIMIT 1", [input.openid]);
    return rowToUser(rows[0]);
  }

  async updateWechatProfile(userId: string, input: WechatProfileInput): Promise<User | null> {
    const sets: string[] = [];
    const params: string[] = [];
    if (input.nickname) {
      sets.push("nickname = ?");
      params.push(input.nickname);
    }
    if (input.avatarUrl) {
      sets.push("avatar_url = ?");
      params.push(input.avatarUrl);
    }
    if (!sets.length) return this.getUser(userId);
    params.push(userId);
    await this.pool.execute(`UPDATE users SET ${sets.join(", ")} WHERE id = ?`, params);
    return this.getUser(userId);
  }

  async authenticateAdmin(username: string, password: string): Promise<User | null> {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      "SELECT * FROM users WHERE username = ? AND role IN ('reviewer','admin') AND status = 'active' LIMIT 1",
      [username],
    );
    const row = rows[0];
    if (!row?.password_hash || !verifyPassword(password, row.password_hash)) return null;
    await this.pool.execute("UPDATE users SET last_login_at = NOW() WHERE id = ?", [row.id]);
    row.last_login_at = new Date();
    return rowToUser(row);
  }

  async listAnimals(filters: { search?: string; status?: string; userId?: string } = {}): Promise<Animal[]> {
    const clauses = ["published = 1"];
    const params: Array<string | number | null> = [];
    if (filters.status && filters.status !== "all") {
      clauses.push("status = ?");
      params.push(filters.status);
    }
    if (filters.search?.trim()) {
      clauses.push("CONCAT_WS(' ', name, nickname, species_name, institution, city) LIKE ?");
      params.push(`%${filters.search.trim()}%`);
    }
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT data_json FROM animals WHERE ${clauses.join(" AND ")} ORDER BY updated_at DESC`,
      params,
    );
    const animals = rows.map((row) => parseJson<Animal>(row.data_json));
    await this.hydrateObservationLikes(animals, filters.userId);
    return animals;
  }

  async getAnimal(id: string, userId?: string): Promise<Animal | null> {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      "SELECT data_json FROM animals WHERE id = ? AND published = 1 LIMIT 1",
      [id],
    );
    if (!rows[0]) return null;
    const animal = parseJson<Animal>(rows[0].data_json);
    await this.hydrateObservationLikes([animal], userId);
    return animal;
  }

  async saveAnimal(animal: Animal, operatorId: string): Promise<Animal> {
    await this.upsertAnimal(animal, true);
    await this.addLog(operatorId, "保存动物档案", "animal", animal.id);
    return animal;
  }

  async deleteAnimal(id: string, operatorId: string): Promise<boolean> {
    const [references] = await this.pool.query<RowDataPacket[]>(
      `SELECT
        (SELECT COUNT(*) FROM memories WHERE JSON_CONTAINS(animal_ids, JSON_QUOTE(?))) memory_count,
        (SELECT COUNT(*) FROM collaboration_tasks WHERE animal_id = ?) task_count`,
      [id, id],
    );
    if (Number(references[0].memory_count) || Number(references[0].task_count)) {
      throw new Error("该动物仍被公众回忆或协作任务引用，请先处理关联内容");
    }
    const [result] = await this.pool.execute<ResultSetHeader>("DELETE FROM animals WHERE id = ?", [id]);
    if (result.affectedRows) await this.addLog(operatorId, "删除动物档案", "animal", id);
    return result.affectedRows > 0;
  }

  async listSpecies(search = ""): Promise<Species[]> {
    const params: unknown[] = [];
    let where = "published = 1";
    if (search.trim()) {
      where += " AND CONCAT_WS(' ', chinese_name, english_name, latin_name) LIKE ?";
      params.push(`%${search.trim()}%`);
    }
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT data_json FROM species WHERE ${where} ORDER BY chinese_name`,
      params,
    );
    return rows.map((row) => parseJson<Species>(row.data_json));
  }

  async getSpecies(id: string): Promise<Species | null> {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      "SELECT data_json FROM species WHERE id = ? AND published = 1 LIMIT 1",
      [id],
    );
    return rows[0] ? parseJson<Species>(rows[0].data_json) : null;
  }

  async saveSpecies(species: Species, operatorId: string): Promise<Species> {
    await this.upsertSpecies(species);
    await this.addLog(operatorId, "保存物种知识", "species", species.id);
    return species;
  }

  async deleteSpecies(id: string, operatorId: string): Promise<boolean> {
    const [references] = await this.pool.query<RowDataPacket[]>("SELECT COUNT(*) count FROM animals WHERE species_code = ?", [id]);
    if (Number(references[0].count)) throw new Error("该物种仍被动物档案引用，请先修改关联档案");
    const [result] = await this.pool.execute<ResultSetHeader>("DELETE FROM species WHERE id = ?", [id]);
    if (result.affectedRows) await this.addLog(operatorId, "删除物种知识", "species", id);
    return result.affectedRows > 0;
  }

  async listMemories(animalId?: string, userId?: string) {
    const likedSql = userId
      ? "EXISTS(SELECT 1 FROM memory_likes ml WHERE ml.memory_id = m.id AND ml.user_id = ?)"
      : "0";
    const params: unknown[] = userId ? [userId] : [];
    if (animalId) params.push(animalId);
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT m.*, ${likedSql} has_liked FROM memories m
       WHERE m.published = 1 ${animalId ? "AND JSON_CONTAINS(m.animal_ids, JSON_QUOTE(?))" : ""}
       ORDER BY m.created_at DESC`,
      params,
    );
    return rows.map((row) => ({
      id: row.id,
      animalIds: parseJson<string[]>(row.animal_ids),
      title: row.title,
      author: row.author_name,
      date: row.memory_date,
      text: row.content,
      category: row.category,
      categoryLabel: row.category_label,
      image: row.image_url || undefined,
      likes: Number(row.likes_count),
      hasLiked: Boolean(row.has_liked),
    }));
  }

  async setMemoryLike(userId: string, memoryId: string, liked: boolean): Promise<{ likes: number; hasLiked: boolean }> {
    let changed = 0;
    if (liked) {
      const [result] = await this.pool.execute<ResultSetHeader>("INSERT IGNORE INTO memory_likes (user_id, memory_id) VALUES (?, ?)", [userId, memoryId]);
      changed = result.affectedRows;
    } else {
      const [result] = await this.pool.execute<ResultSetHeader>("DELETE FROM memory_likes WHERE user_id = ? AND memory_id = ?", [userId, memoryId]);
      changed = result.affectedRows;
    }
    if (changed) {
      await this.pool.execute("UPDATE memories SET likes_count = GREATEST(0, likes_count + ?) WHERE id = ?", [liked ? 1 : -1, memoryId]);
    }
    const [rows] = await this.pool.query<RowDataPacket[]>("SELECT likes_count FROM memories WHERE id = ?", [memoryId]);
    return { likes: Number(rows[0]?.likes_count || 0), hasLiked: liked };
  }

  async saveMemory(memory: PublicMemoryRecord, operatorId: string): Promise<PublicMemoryRecord> {
    await this.pool.execute(
      `INSERT INTO memories
       (id, animal_ids, title, author_name, memory_date, content, category, category_label, image_url, likes_count, published)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
       ON DUPLICATE KEY UPDATE animal_ids=VALUES(animal_ids), title=VALUES(title), author_name=VALUES(author_name),
         memory_date=VALUES(memory_date), content=VALUES(content), category=VALUES(category),
         category_label=VALUES(category_label), image_url=VALUES(image_url), published=1`,
      [
        memory.id,
        JSON.stringify(memory.animalIds),
        memory.title,
        memory.author,
        memory.date,
        memory.text,
        memory.category,
        memory.categoryLabel,
        memory.image || null,
        memory.likes || 0,
      ],
    );
    await this.addLog(operatorId, "保存公众回忆", "memory", memory.id);
    return { ...memory, hasLiked: false };
  }

  async deleteMemory(id: string, operatorId: string): Promise<boolean> {
    const [result] = await this.pool.execute<ResultSetHeader>("DELETE FROM memories WHERE id = ?", [id]);
    if (result.affectedRows) await this.addLog(operatorId, "删除公众回忆", "memory", id);
    return result.affectedRows > 0;
  }

  async listMemorialComments(animalId?: string, userId?: string): Promise<MemorialCommentRecord[]> {
    const floweredSql = userId
      ? "EXISTS(SELECT 1 FROM comment_flowers cf2 WHERE cf2.comment_id = c.id AND cf2.user_id = ?)"
      : "0";
    const params: unknown[] = userId ? [userId] : [];
    if (animalId) params.push(animalId);
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT c.*, u.nickname username,
        c.base_flowers_count + (SELECT COUNT(*) FROM comment_flowers cf WHERE cf.comment_id = c.id) flowers,
        ${floweredSql} has_flowered
       FROM memorial_comments c
       LEFT JOIN users u ON u.id = c.user_id
       ${animalId ? "WHERE c.animal_id = ?" : ""}
       ORDER BY c.created_at DESC`,
      params,
    );
    return rows.map((row) => ({
      id: row.id,
      animalId: row.animal_id,
      username: row.username || row.author_name,
      text: row.content,
      timestamp: iso(row.created_at),
      flowers: Number(row.flowers),
      hasFlowered: Boolean(row.has_flowered),
    }));
  }

  async createMemorialComment(user: User, animalId: string, text: string): Promise<MemorialCommentRecord> {
    const id = `comment-${randomUUID()}`;
    await this.pool.execute(
      "INSERT INTO memorial_comments (id, user_id, author_name, animal_id, content) VALUES (?, ?, ?, ?, ?)",
      [id, user.id, user.nickname, animalId, text],
    );
    const [rows] = await this.pool.query<RowDataPacket[]>("SELECT created_at FROM memorial_comments WHERE id = ?", [id]);
    return {
      id,
      animalId,
      username: user.nickname,
      text,
      timestamp: iso(rows[0].created_at),
      flowers: 0,
      hasFlowered: false,
    };
  }

  async setCommentFlower(userId: string, commentId: string, flowered: boolean): Promise<{ flowers: number; hasFlowered: boolean }> {
    if (flowered) {
      await this.pool.execute("INSERT IGNORE INTO comment_flowers (user_id, comment_id) VALUES (?, ?)", [userId, commentId]);
    } else {
      await this.pool.execute("DELETE FROM comment_flowers WHERE user_id = ? AND comment_id = ?", [userId, commentId]);
    }
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT c.base_flowers_count + (SELECT COUNT(*) FROM comment_flowers cf WHERE cf.comment_id = c.id) count
       FROM memorial_comments c WHERE c.id = ?`,
      [commentId],
    );
    return { flowers: Number(rows[0]?.count || 0), hasFlowered: flowered };
  }

  async listTasks(): Promise<CollaborationTask[]> {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT t.*,
        t.base_contribution_count + (
          SELECT COUNT(*) FROM submissions s
          WHERE s.type = 'archive' AND s.status = 'approved'
            AND JSON_UNQUOTE(JSON_EXTRACT(s.payload_json, '$.taskId')) = t.id
        ) contribution_count
       FROM collaboration_tasks t
       WHERE t.status = 'active'
       ORDER BY t.created_at DESC`,
    );
    return rows.map((row) => {
      const contributionCount = Number(row.contribution_count || 0);
      return {
        id: row.id,
        title: row.title,
        description: row.description,
        rewardLabel: row.reward_label,
        progressText: contributionCount ? `已有 ${contributionCount} 条审核通过的线索` : "等待第一条有效线索",
        actionText: "提供线索",
        animalId: row.animal_id || undefined,
        animalName: row.animal_name || undefined,
        expectedInfo: row.expected_info,
        creatorName: row.creator_name,
        contributionCount,
        createdAt: iso(row.created_at),
      };
    });
  }

  async saveTask(task: CollaborationTask, operatorId: string): Promise<CollaborationTask> {
    await this.pool.execute(
      `INSERT INTO collaboration_tasks
       (id, creator_id, creator_name, animal_id, animal_name, title, description, expected_info, reward_label, base_contribution_count, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
       ON DUPLICATE KEY UPDATE creator_name=VALUES(creator_name), animal_id=VALUES(animal_id),
         animal_name=VALUES(animal_name), title=VALUES(title), description=VALUES(description),
         expected_info=VALUES(expected_info), reward_label=VALUES(reward_label), status='active'`,
      [
        task.id,
        operatorId,
        task.creatorName || "管理后台",
        task.animalId || null,
        task.animalName || "",
        task.title,
        task.description,
        task.expectedInfo || "",
        task.rewardLabel,
        task.contributionCount || 0,
      ],
    );
    await this.addLog(operatorId, "保存协作任务", "task", task.id);
    return task;
  }

  async deleteTask(id: string, operatorId: string): Promise<boolean> {
    const [result] = await this.pool.execute<ResultSetHeader>("DELETE FROM collaboration_tasks WHERE id = ?", [id]);
    if (result.affectedRows) await this.addLog(operatorId, "删除协作任务", "task", id);
    return result.affectedRows > 0;
  }

  async listFavorites(userId: string): Promise<Animal[]> {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT a.data_json FROM favorites f
       JOIN animals a ON a.id = f.animal_id
       WHERE f.user_id = ? AND a.published = 1
       ORDER BY f.created_at DESC`,
      [userId],
    );
    return rows.map((row) => parseJson<Animal>(row.data_json));
  }

  async setFavorite(userId: string, animalId: string, favorite: boolean): Promise<boolean> {
    if (favorite) {
      await this.pool.execute("INSERT IGNORE INTO favorites (user_id, animal_id) VALUES (?, ?)", [userId, animalId]);
    } else {
      await this.pool.execute("DELETE FROM favorites WHERE user_id = ? AND animal_id = ?", [userId, animalId]);
    }
    return favorite;
  }

  async lightCandle(userId: string, animalId: string): Promise<{ count: number; alreadyLit: boolean }> {
    const [result] = await this.pool.execute<ResultSetHeader>(
      "INSERT IGNORE INTO candles (id, user_id, animal_id, lit_date) VALUES (?, ?, ?, CURRENT_DATE)",
      [`candle-${randomUUID()}`, userId, animalId],
    );
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT COALESCE((SELECT candle_base_count FROM animal_metrics WHERE animal_id = ?), 0)
        + (SELECT COUNT(*) FROM candles WHERE animal_id = ?) count`,
      [animalId, animalId],
    );
    return { count: Number(rows[0].count), alreadyLit: result.affectedRows === 0 };
  }

  async listCandleStats(userId?: string): Promise<CandleStat[]> {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT a.id animal_id, COALESCE(am.candle_base_count, 0) + COUNT(c.id) count,
        ${userId ? "EXISTS(SELECT 1 FROM candles mine WHERE mine.animal_id = a.id AND mine.user_id = ? AND mine.lit_date = CURRENT_DATE)" : "0"} has_lit_today
       FROM animals a
       LEFT JOIN candles c ON c.animal_id = a.id
       LEFT JOIN animal_metrics am ON am.animal_id = a.id
       WHERE a.published = 1
       GROUP BY a.id, am.candle_base_count`,
      userId ? [userId] : [],
    );
    return rows.map((row) => ({
      animalId: row.animal_id,
      count: Number(row.count),
      hasLitToday: Boolean(row.has_lit_today),
    }));
  }

  async setObservationLike(userId: string, animalId: string, observationId: string, liked: boolean): Promise<{ likes: number; hasLiked: boolean }> {
    const connection = await this.pool.getConnection();
    try {
      await connection.beginTransaction();
      const [rows] = await connection.query<RowDataPacket[]>("SELECT data_json FROM animals WHERE id = ? FOR UPDATE", [animalId]);
      if (!rows[0]) throw new Error("动物档案不存在");
      const animal = parseJson<Animal>(rows[0].data_json);
      const observation = animal.observations.find((item) => item.id === observationId);
      if (!observation) throw new Error("观察记录不存在");
      let changed = 0;
      if (liked) {
        const [result] = await connection.execute<ResultSetHeader>(
          "INSERT IGNORE INTO observation_likes (user_id, animal_id, observation_id) VALUES (?, ?, ?)",
          [userId, animalId, observationId],
        );
        changed = result.affectedRows;
      } else {
        const [result] = await connection.execute<ResultSetHeader>(
          "DELETE FROM observation_likes WHERE user_id = ? AND animal_id = ? AND observation_id = ?",
          [userId, animalId, observationId],
        );
        changed = result.affectedRows;
      }
      if (changed) {
        observation.likes = Math.max(0, Number(observation.likes || 0) + (liked ? 1 : -1));
        await connection.execute("UPDATE animals SET data_json = ? WHERE id = ?", [JSON.stringify(animal), animalId]);
      }
      await connection.commit();
      return { likes: observation.likes, hasLiked: liked };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async getProfileStats(userId: string): Promise<ProfileStats> {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT
        (SELECT COUNT(*) FROM submissions WHERE user_id = ?) submission_count,
        (SELECT COUNT(*) FROM submissions WHERE user_id = ? AND status = 'pending') pending_count,
        (SELECT COUNT(*) FROM submissions WHERE user_id = ? AND status = 'approved') approved_count,
        (SELECT COUNT(*) FROM favorites WHERE user_id = ?) favorite_count`,
      [userId, userId, userId, userId],
    );
    return {
      submissionCount: Number(rows[0].submission_count),
      pendingCount: Number(rows[0].pending_count),
      approvedContributionCount: Number(rows[0].approved_count),
      favoriteCount: Number(rows[0].favorite_count),
    };
  }

  async saveMedia(userId: string, file: {
    originalName: string;
    mimeType: string;
    size: number;
    storagePath: string;
    publicUrl: string;
  }): Promise<string> {
    const id = `media-${randomUUID()}`;
    await this.pool.execute(
      `INSERT INTO media_files
       (id, user_id, original_name, mime_type, size_bytes, storage_path, public_url, file_data)
       VALUES (?, ?, ?, ?, ?, ?, ?, NULL)`,
      [id, userId, file.originalName, file.mimeType, file.size, file.storagePath, file.publicUrl],
    );
    return id;
  }

  async getMedia(id: string): Promise<{
    originalName: string;
    mimeType: string;
    size: number;
    storagePath?: string;
    publicUrl?: string;
    data?: Buffer;
  } | null> {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT original_name, mime_type, size_bytes, storage_path, public_url, file_data
       FROM media_files WHERE id = ? LIMIT 1`,
      [id],
    );
    const row = rows[0];
    if (!row) return null;
    return {
      originalName: row.original_name,
      mimeType: row.mime_type,
      size: Number(row.size_bytes),
      storagePath: row.storage_path || undefined,
      publicUrl: row.public_url || undefined,
      data: row.file_data ? row.file_data as Buffer : undefined,
    };
  }

  async createSubmission(
    user: User,
    input: {
      type: SubmissionType;
      animalId?: string;
      animalName?: string;
      title: string;
      details: string;
      payload: Record<string, unknown>;
      mediaUrl?: string;
      source?: string;
      copyright?: string;
    },
  ): Promise<SubmissionRecord> {
    const id = `sub-${randomUUID()}`;
    const adminComment = "内容已进入人工审核队列，审核通过后才会公开。";
    await this.pool.execute(
      `INSERT INTO submissions
       (id, user_id, type, animal_id, animal_name, title, details, payload_json, media_url, source_text, copyright_text, status, admin_comment)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
      [
        id,
        user.id,
        input.type,
        input.animalId || null,
        input.animalName || "待确认动物",
        input.title,
        input.details,
        JSON.stringify(input.payload),
        input.mediaUrl || null,
        input.source || null,
        input.copyright || null,
        adminComment,
      ],
    );
    return (await this.getSubmission(id))!;
  }

  async listUserSubmissions(userId: string): Promise<SubmissionRecord[]> {
    return this.querySubmissions("s.user_id = ?", [userId]);
  }

  async listAdminSubmissions(
    filters: { status?: SubmissionStatus; type?: SubmissionType } = {},
  ): Promise<SubmissionRecord[]> {
    const clauses: string[] = [];
    const params: unknown[] = [];
    if (filters.status) {
      clauses.push("s.status = ?");
      params.push(filters.status);
    }
    if (filters.type) {
      clauses.push("s.type = ?");
      params.push(filters.type);
    }
    return this.querySubmissions(clauses.length ? clauses.join(" AND ") : "1 = 1", params);
  }

  async reviewSubmission(
    id: string,
    reviewer: User,
    input: ReviewInput,
  ): Promise<SubmissionRecord | null> {
    const connection = await this.pool.getConnection();
    try {
      await connection.beginTransaction();
      const [rows] = await connection.query<RowDataPacket[]>(
        `SELECT s.*, u.nickname submitter_name
         FROM submissions s JOIN users u ON u.id = s.user_id
         WHERE s.id = ? FOR UPDATE`,
        [id],
      );
      const row = rows[0];
      if (!row) {
        await connection.rollback();
        return null;
      }
      await connection.execute(
        `UPDATE submissions SET status = ?, admin_comment = ?, reviewer_id = ?, reviewed_at = NOW() WHERE id = ?`,
        [input.status, input.comment || row.admin_comment, reviewer.id, id],
      );
      if (input.status === "approved" && row.status !== "approved") {
        await this.publishSubmission(connection, row);
      }
      await connection.execute(
        `INSERT INTO review_logs (id, operator_id, operator_name, action_text, target_type, target_id)
         VALUES (?, ?, ?, ?, 'submission', ?)`,
        [`log-${randomUUID()}`, reviewer.id, reviewer.nickname, `审核${submissionStatusLabel(input.status)}：${row.title}`, id],
      );
      await connection.commit();
      return await this.getSubmission(id);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async getAdminStats(): Promise<AdminStats> {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT
        (SELECT COUNT(*) FROM submissions WHERE status = 'pending') pending,
        (SELECT COUNT(*) FROM submissions WHERE DATE(submitted_at) = CURRENT_DATE) today,
        (SELECT COUNT(*) FROM submissions WHERE status = 'approved' AND DATE_FORMAT(reviewed_at, '%Y-%m') = DATE_FORMAT(CURRENT_DATE, '%Y-%m')) approved_this_month,
        (SELECT COUNT(*) FROM animals WHERE published = 1) animal_count`,
    );
    return {
      pending: Number(rows[0].pending),
      today: Number(rows[0].today),
      approvedThisMonth: Number(rows[0].approved_this_month),
      animalCount: Number(rows[0].animal_count),
    };
  }

  async listUsers(search = ""): Promise<User[]> {
    const params: unknown[] = [];
    let where = "1 = 1";
    if (search.trim()) {
      where = "CONCAT_WS(' ', id, nickname, username) LIKE ?";
      params.push(`%${search.trim()}%`);
    }
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT * FROM users WHERE ${where} ORDER BY created_at DESC`,
      params,
    );
    return rows.map(rowToUser);
  }

  async updateUser(id: string, update: UserUpdateInput, operatorId: string): Promise<User | null> {
    const sets: string[] = [];
    const params: string[] = [];
    if (update.role) {
      sets.push("role = ?");
      params.push(update.role);
    }
    if (update.status) {
      sets.push("status = ?");
      params.push(update.status);
    }
    if (!sets.length) return this.getUser(id);
    params.push(id);
    await this.pool.execute(`UPDATE users SET ${sets.join(", ")} WHERE id = ?`, params);
    await this.addLog(operatorId, "更新用户权限", "user", id);
    return this.getUser(id);
  }

  async listReviewLogs(): Promise<ReviewLog[]> {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      "SELECT * FROM review_logs ORDER BY created_at DESC LIMIT 200",
    );
    return rows.map((row) => ({
      id: row.id,
      operator: row.operator_name,
      action: row.action_text,
      targetType: row.target_type,
      targetId: row.target_id,
      createdAt: iso(row.created_at),
    }));
  }

  private async ensureAdmin(): Promise<void> {
    const username = process.env.ADMIN_USERNAME || "admin";
    const password = process.env.ADMIN_PASSWORD || "ahang-admin";
    if (process.env.NODE_ENV === "production" && password === "ahang-admin") {
      throw new Error("ADMIN_PASSWORD must be changed in production");
    }
    await this.pool.execute(
      `INSERT IGNORE INTO users
       (id, username, password_hash, nickname, avatar_url, role, status, last_login_at)
       VALUES ('admin-local', ?, ?, ?, '', 'admin', 'active', NOW())`,
      [username, hashPassword(password), process.env.ADMIN_DISPLAY_NAME || "阿杭管理员"],
    );
  }

  private async ensureMediaStorageColumns(): Promise<void> {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT COLUMN_NAME, IS_NULLABLE
       FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'media_files'`,
    );
    const columns = new Map(rows.map((row) => [String(row.COLUMN_NAME), String(row.IS_NULLABLE)]));
    if (!columns.has("storage_path")) {
      await this.pool.query("ALTER TABLE media_files ADD COLUMN storage_path VARCHAR(500) NULL AFTER size_bytes");
    }
    if (!columns.has("public_url")) {
      await this.pool.query("ALTER TABLE media_files ADD COLUMN public_url TEXT NULL AFTER storage_path");
    }
    if (columns.get("file_data") === "NO") {
      await this.pool.query("ALTER TABLE media_files MODIFY COLUMN file_data LONGBLOB NULL");
    }
  }

  private async upsertAnimal(animal: Animal, published: boolean, ignoreExisting = false): Promise<void> {
    const verb = ignoreExisting ? "INSERT IGNORE" : "INSERT";
    const update = ignoreExisting
      ? ""
      : `ON DUPLICATE KEY UPDATE name=VALUES(name), nickname=VALUES(nickname), species_code=VALUES(species_code), species_name=VALUES(species_name), status=VALUES(status), institution=VALUES(institution), city=VALUES(city), image_url=VALUES(image_url), summary=VALUES(summary), data_json=VALUES(data_json), published=VALUES(published)`;
    await this.pool.execute(
      `${verb} INTO animals
       (id, name, nickname, species_code, species_name, status, institution, city, image_url, summary, data_json, published)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ${update}`,
      [
        animal.id,
        animal.name,
        animal.nickname || "",
        animal.speciesCode || "",
        animal.species || "",
        animal.status,
        animal.institution || "",
        animal.city || "",
        animal.image || "",
        animal.summary || animal.description || "",
        JSON.stringify(animal),
        published ? 1 : 0,
      ],
    );
  }

  private async upsertSpecies(species: Species, ignoreExisting = false): Promise<void> {
    const verb = ignoreExisting ? "INSERT IGNORE" : "INSERT";
    const update = ignoreExisting
      ? ""
      : "ON DUPLICATE KEY UPDATE chinese_name=VALUES(chinese_name), english_name=VALUES(english_name), latin_name=VALUES(latin_name), data_json=VALUES(data_json), published=1";
    const profile = species.biologicalProfile;
    await this.pool.execute(
      `${verb} INTO species (id, chinese_name, english_name, latin_name, data_json, published)
       VALUES (?, ?, ?, ?, ?, 1) ${update}`,
      [species.id, profile.chineseName, profile.englishName, profile.latinName, JSON.stringify(species)],
    );
  }

  private async getSubmission(id: string): Promise<SubmissionRecord | null> {
    const rows = await this.querySubmissions("s.id = ?", [id]);
    return rows[0] || null;
  }

  private async querySubmissions(where: string, params: unknown[]): Promise<SubmissionRecord[]> {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT s.*, u.nickname submitter_name, reviewer.nickname reviewer_name
       FROM submissions s
       JOIN users u ON u.id = s.user_id
       LEFT JOIN users reviewer ON reviewer.id = s.reviewer_id
       WHERE ${where}
       ORDER BY s.submitted_at DESC`,
      params,
    );
    return rows.map(rowToSubmission);
  }

  private async hydrateObservationLikes(animals: Animal[], userId?: string): Promise<void> {
    for (const animal of animals) {
      for (const observation of animal.observations || []) observation.hasLiked = false;
    }
    if (!userId || !animals.length) return;
    const animalIds = animals.map((animal) => animal.id);
    const placeholders = animalIds.map(() => "?").join(",");
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT animal_id, observation_id FROM observation_likes WHERE user_id = ? AND animal_id IN (${placeholders})`,
      [userId, ...animalIds],
    );
    const liked = new Set(rows.map((row) => `${row.animal_id}:${row.observation_id}`));
    for (const animal of animals) {
      for (const observation of animal.observations || []) {
        observation.hasLiked = liked.has(`${animal.id}:${observation.id}`);
      }
    }
  }

  private async publishSubmission(connection: PoolConnection, row: RowDataPacket): Promise<void> {
    const payload = parseJson<Record<string, unknown>>(row.payload_json);
    if (row.type === "task") {
      await connection.execute(
        `INSERT IGNORE INTO collaboration_tasks
         (id, creator_id, creator_name, animal_id, animal_name, title, description, expected_info, reward_label, source_submission_id, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
        [
          `task-${String(row.id).slice(4)}`,
          row.user_id,
          row.submitter_name || "公众发起人",
          row.animal_id || null,
          row.animal_name || "",
          row.title,
          row.details,
          String(payload.expectedInfo || "可核验的文字、图片或公开来源"),
          String(payload.rewardLabel || "共同完善动物档案"),
          row.id,
        ],
      );
      return;
    }

    if (row.type === "archive" && typeof payload.taskId === "string") return;

    if (row.type === "observation" && row.animal_id) {
      const [animalRows] = await connection.query<RowDataPacket[]>(
        "SELECT data_json FROM animals WHERE id = ? FOR UPDATE",
        [row.animal_id],
      );
      if (!animalRows[0]) return;
      const animal = parseJson<Animal>(animalRows[0].data_json);
      const observation: ObservationRecord = {
        id: `obs-${randomUUID()}`,
        username: row.submitter_name || "公众观察员",
        avatar: "",
        date: String(payload.dateTime || iso(row.submitted_at)),
        location: String(payload.location || "未填写地点"),
        text: row.details,
        image: row.media_url || undefined,
        likes: 0,
        commentsCount: 0,
        category: "all",
      };
      animal.observations.unshift(observation);
      animal.recordCount = (animal.recordCount || 0) + 1;
      await connection.execute("UPDATE animals SET data_json = ? WHERE id = ?", [JSON.stringify(animal), row.animal_id]);
      return;
    }
    if (row.type === "memory" || row.type === "archive") {
      await connection.execute(
        `INSERT IGNORE INTO memories
         (id, user_id, animal_ids, title, author_name, memory_date, content, category, category_label, image_url, submission_id, published)
         SELECT ?, user_id, ?, title, ?, ?, details, ?, ?, media_url, id, 1 FROM submissions WHERE id = ?`,
        [
          `memory-${randomUUID()}`,
          JSON.stringify(row.animal_id ? [row.animal_id] : []),
          row.submitter_name || "公众贡献者",
          String(payload.date || iso(row.submitted_at).slice(0, 10)),
          row.type === "archive" ? "archive" : "reminiscence",
          row.type === "archive" ? "📚 资料" : "🌿 回忆",
          row.id,
        ],
      );
      return;
    }
    if (row.type === "recommend" && payload.animal && typeof payload.animal === "object") {
      const animal = payload.animal as Animal;
      await connection.execute(
        `INSERT INTO animals
         (id, name, nickname, species_code, species_name, status, institution, city, image_url, summary, data_json, published)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
         ON DUPLICATE KEY UPDATE data_json=VALUES(data_json), published=1, updated_at=NOW()`,
        [
          animal.id,
          animal.name,
          animal.nickname || "",
          animal.speciesCode || "",
          animal.species || "",
          animal.status,
          animal.institution || "",
          animal.city || "",
          animal.image || "",
          animal.summary || animal.description || "",
          JSON.stringify(animal),
        ],
      );
    }
  }

  private async addLog(operatorId: string, action: string, targetType: string, targetId: string): Promise<void> {
    const user = await this.getUser(operatorId);
    await this.pool.execute(
      `INSERT INTO review_logs (id, operator_id, operator_name, action_text, target_type, target_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [`log-${randomUUID()}`, operatorId, user?.nickname || operatorId, action, targetType, targetId],
    );
  }
}
