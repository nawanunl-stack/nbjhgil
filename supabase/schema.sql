CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- แผนก
CREATE TABLE departments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255),
  line_token VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- โปรไฟล์ผู้ใช้
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'viewer',
  department_id UUID REFERENCES departments(id),
  phone VARCHAR(20),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- หมวดหมู่กฎหมาย
CREATE TABLE legal_categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  color VARCHAR(20) DEFAULT '#3B82F6'
);

-- ทะเบียนกฎหมาย
CREATE TABLE legal_registry (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  law_code VARCHAR(100) UNIQUE NOT NULL,
  title VARCHAR(500) NOT NULL,
  full_title TEXT,
  category_id UUID REFERENCES legal_categories(id),
  law_type VARCHAR(100),
  issuing_authority VARCHAR(255),
  effective_date DATE,
  gazette_volume VARCHAR(50),
  gazette_issue VARCHAR(50),
  gazette_date DATE,
  gazette_url TEXT,
  status VARCHAR(50) DEFAULT 'active',
  summary TEXT,
  full_content TEXT,
  source VARCHAR(50) DEFAULT 'manual',
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ข้อกำหนดย่อยแยกตามกฎหมาย (วิเคราะห์แล้ว)
CREATE TABLE law_requirements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  law_id UUID REFERENCES legal_registry(id) ON DELETE CASCADE,
  item_number VARCHAR(20),
  section_name VARCHAR(255),
  who_must_do TEXT NOT NULL,
  what_to_do TEXT NOT NULL,
  where_to_do TEXT,
  how_to_do TEXT,
  related_documents TEXT[],
  related_departments UUID[],
  frequency VARCHAR(100),
  deadline_days INTEGER,
  priority VARCHAR(20) DEFAULT 'medium',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- การประเมินความสอดคล้อง
CREATE TABLE compliance_assessments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  law_id UUID REFERENCES legal_registry(id),
  requirement_id UUID REFERENCES law_requirements(id),
  department_id UUID REFERENCES departments(id),
  status VARCHAR(50) DEFAULT 'not_started',
  compliance_level INTEGER DEFAULT 0,
  evidence TEXT,
  evidence_url TEXT,
  assessor_id UUID REFERENCES profiles(id),
  assessed_date DATE,
  next_review_date DATE,
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ประวัติการแจ้งเตือน
CREATE TABLE notification_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  law_id UUID REFERENCES legal_registry(id),
  department_id UUID REFERENCES departments(id),
  type VARCHAR(50),
  recipient VARCHAR(255),
  message TEXT,
  status VARCHAR(50) DEFAULT 'sent',
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

-- Log การดึงข้อมูล
CREATE TABLE fetch_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  source VARCHAR(100),
  records_found INTEGER DEFAULT 0,
  records_added INTEGER DEFAULT 0,
  status VARCHAR(50),
  error_message TEXT,
  fetched_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_legal_status ON legal_registry(status);
CREATE INDEX idx_legal_effective ON legal_registry(effective_date DESC);
CREATE INDEX idx_compliance_status ON compliance_assessments(status);
CREATE INDEX idx_compliance_dept ON compliance_assessments(department_id);
CREATE INDEX idx_requirements_law ON law_requirements(law_id);

-- RLS
ALTER TABLE legal_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE law_requirements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_read_legal"
ON legal_registry FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "officer_write_legal"
ON legal_registry FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('safety_officer', 'admin')
  )
);

CREATE POLICY "authenticated_read_requirements"
ON law_requirements FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "authenticated_read_compliance"
ON compliance_assessments FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "officer_write_compliance"
ON compliance_assessments FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('safety_officer', 'admin')
  )
);

-- Seed Data
INSERT INTO departments (name, code, email) VALUES
('ฝ่ายผลิต', 'PROD', 'production@company.com'),
('ฝ่ายบุคคล', 'HR', 'hr@company.com'),
('ฝ่ายวิศวกรรม', 'ENG', 'engineering@company.com'),
('ฝ่ายคลังสินค้า', 'WH', 'warehouse@company.com'),
('ฝ่ายความปลอดภัย', 'SAFETY', 'safety@company.com');

INSERT INTO legal_categories (name, description, color) VALUES
('ความปลอดภัยในการทำงาน', 'กฎหมายด้านความปลอดภัยและอาชีวอนามัย', '#3B82F6'),
('อัคคีภัย', 'กฎหมายป้องกันอัคคีภัย', '#EF4444'),
('เครื่องจักร', 'กฎหมายเกี่ยวกับเครื่องจักร', '#F59E0B'),
('สารเคมีอันตราย', 'กฎหมายสารเคมีและวัตถุอันตราย', '#8B5CF6'),
('แรงงาน', 'กฎหมายแรงงานและสวัสดิการ', '#10B981'),
('สิ่งแวดล้อม', 'กฎหมายด้านสิ่งแวดล้อม', '#06B6D4');

Copy

Copy
