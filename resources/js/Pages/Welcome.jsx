import React, { useEffect } from 'react';
import { Layout, Typography, Button, Row, Col, Card, notification } from 'antd';
import { usePage } from '@inertiajs/react';
import { MailOutlined, UserOutlined, DollarOutlined } from '@ant-design/icons';
import styles from './Welcome.module.scss';

const { Header, Content, Footer } = Layout;
const { Title, Paragraph, Text } = Typography;

export default function Welcome() {
  const { props } = usePage();
  const error = props.error || (props.flash && props.flash.error);

  useEffect(() => {
    if (error) {
      notification.error({
        message: 'Invitación no válida',
        description: error,
        placement: 'bottomRight',
        duration: 6
      });
    }
  }, [error]);

  return (
    <Layout className={styles.welcomeBg} style={{ minHeight: '100vh' }}>
      <Header className={styles.header} style={{ background: '#021526', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <img src="/storage/logos/logo.png" alt="CMM" style={{ width: 120, marginRight: 16, filter: 'brightness(0) invert(1)' }} />
          {/* <Title level={3} style={{ color: 'white', margin: 0, letterSpacing: 2 }}>CMM</Title> */}
        </div>
        <Button type="primary" size="large" href="/login" className={styles.adminButton}>
          Acceder
        </Button>
      </Header>
      <Content style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
        <div className={styles.welcomeContainer}>
          <Title className={styles.welcomeTitle}>
            CM Managment
          </Title>
          <Text className={styles.welcomeSubtitle}>
            Administra perfiles, portafolios y carreras de modelos de manera eficiente
          </Text>
          <Row gutter={32} className={styles.features} justify="center">
            <Col xs={24} sm={12} md={8}>
              <Card className={styles.featureCard} bordered={false}>
                <Title level={4}><UserOutlined /> Gestión de Modelos</Title>
                <Paragraph>Administra perfiles, portafolios y carreras de modelos de manera eficiente</Paragraph>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Card className={styles.featureCard} bordered={false}>
                <Title level={4}><DollarOutlined /> Control de Caja</Title>
                <Paragraph>Gestiona ingresos, gastos y flujo de efectivo con reportes detallados</Paragraph>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Card className={styles.featureCard} bordered={false}>
                <Title level={4}><MailOutlined /> Academia</Title>
                <Paragraph>Control de asistencias, horarios y seguimiento académico</Paragraph>
              </Card>
            </Col>
          </Row>
        </div>
      </Content>
      <Footer className={styles.footer} style={{ background: '#03346E', width: '100%' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <Text style={{ color: 'rgba(255,255,255,0.7)' }}>
            © {new Date().getFullYear()} CM Managment. Todos los derechos reservados.
          </Text>
          <div style={{ marginTop: 12 }}>
            <Text style={{ color: 'rgba(255,255,255,0.5)', marginRight: 16 }}>Términos y Condiciones</Text>
            <Text style={{ color: 'rgba(255,255,255,0.5)' }}>Política de Privacidad</Text>
          </div>
        </div>
      </Footer>
    </Layout>
  );
} 