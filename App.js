import { Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SQLiteProvider, useSQLiteContext } from 'expo-sqlite';
import { useState, useEffect } from 'react';
import { AntDesign } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';

import DateTimePicker  from '@react-native-community/datetimepicker';

const formatarData = (dataISO) => {
  if (!dataISO) return 'Sem data limite';
  const data = new Date(dataISO);
  return `${data.getDate().toString().padStart(2, '0')}/${(data.getMonth() + 1).toString().padStart(2, '0')}/${data.getFullYear()}`;
};

const iniciarBancoDeDados = async (db) => {
  try {
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      -- DROP TABLE tarefa;
      CREATE TABLE IF NOT EXISTS tarefa (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT,
        descricao TEXT,
        data_limite TEXT,
        categoria TEXT
      );
    `)
    console.log('Banco de Dados inicializado')
  } catch (error) {
    console.log('Erro ao iniciar o Banco de Dados.');
  }
  
}

const TarefaBotao = ({ tarefa, excluirTarefa, atualizarTarefa }) => {
  const [tarefaSelecionada, setTarefaSelecionada] = useState(null);
  const [estaEditando, setEstaEditando] = useState(false);
  const [tarefaEditada, setTarefaEditada] = useState({
    nome: '',
    descricao: '',
    data_limite: '',
    categoria: '',
  });

  const confirmarExcluir = () => {
    Alert.alert(
      "Atenção!",
      'Deseja excluir a tarefa da lista?',
      [
        { text: 'Não', onPress: () => {}, style: 'cancel' },
        { text: 'Sim', onPress: () => excluirTarefa(tarefa.id) },
      ],
      { cancelable: true }
    );
  }

  const iniciarEdicao = () => {
    setTarefaEditada({
      nome: tarefa.nome,
      descricao: tarefa.descricao,
      data_limite: tarefa.data_limite || '',
      categoria: tarefa.categoria || '', 
    });
    setEstaEditando(true);
  };

  const handleEditar = () => {
    atualizarTarefa(tarefa.id, tarefaEditada.nome, tarefaEditada.descricao, tarefaEditada.data_limite, tarefaEditada.categoria);
    setEstaEditando(false);
  }

  return (
    <View>
      <Pressable 
        style={styles.tarefaBotao}
        onPress={() => setTarefaSelecionada(tarefaSelecionada === tarefa.id ? null : tarefa.id)}
      >
        <Text style={styles.tarefaTexto}>{tarefa.id} - {tarefa.nome}</Text>
        {tarefaSelecionada === tarefa.id && (
          <View style={styles.actions}>
            <AntDesign 
              name='edit'
              size={18}
              color='red'
              onPress={iniciarEdicao}
              style={styles.icon}
            />
            <AntDesign 
              name='delete'
              size={18}
              color='red'
              onPress={confirmarExcluir}
              style={styles.icon}
            />
          </View>
        )}
      </Pressable>

      {tarefaSelecionada === tarefa.id && !estaEditando && (
        <View style={styles.tarefaConteudo}>
        <Text>Nome: {tarefa.nome}</Text>
        <Text>Descrição: {tarefa.descricao}</Text>
        <Text>Data Limite: {formatarData(tarefa.data_limite)}</Text>
        <Text>Categoria: {tarefa.categoria}</Text>
      </View>
      )}

      {tarefaSelecionada === tarefa.id && estaEditando && (
        <TarefaFormulario 
          tarefa={tarefaEditada} 
          setTarefa={setTarefaEditada} 
          onSave={handleEditar} 
          setMostrarFormulario={setEstaEditando} 
        />
      )}
    </View>
  );
};


const TarefaFormulario = ({ tarefa, setTarefa, onSave, setMostrarFormulario }) => {
  
  const [showPicker, setShowPicker] = useState(false);

  const handleDateChange = (event, selectedDate) => {
    setShowPicker(false);
    if (selectedDate) {
      setTarefa({ ...tarefa, data_limite: selectedDate.toISOString().split('T')[0] });
    }
  };

  return (
    <View>
      <TextInput 
        style={styles.input}
        placeholder='Nome'
        value={tarefa.nome}
        autoCapitalize='words'
        onChangeText={(text) => setTarefa({...tarefa, nome: text})}
      />
      <TextInput 
        style={styles.input}
        placeholder='Descrição'
        value={tarefa.descricao}
        onChangeText={(text) => setTarefa({...tarefa, descricao: text})}
        autoCapitalize='none'
      />
        <Pressable onPress={() => setShowPicker(true)} style={styles.input}>
        <Text>{tarefa.data_limite ? `Data Limite: ${tarefa.data_limite}` : 'Escolher Data Limite'}</Text>
      </Pressable>
      {showPicker && (
        <DateTimePicker
          mode="date"
          value={new Date(tarefa.data_limite || new Date())}
          onChange={handleDateChange}
        />
      )}
     
     <Picker
        selectedValue={tarefa.categoria}
        style={styles.picker}
        onValueChange={(itemValue) => setTarefa({...tarefa, categoria: itemValue})}
      >
        <Picker.Item label="Afazeres Domésticos" value="Afazeres Domésticos" />
        <Picker.Item label="Exercícios" value="Exercícios" />
        <Picker.Item label="Manutenção" value="Manutenção" />
        <Picker.Item label="Lazer" value="Lazer" />
      </Picker>

      <Pressable
        onPress={onSave}
        style={styles.saveButton}
      >
        <Text style={styles.buttonText}>Salvar</Text>
      </Pressable>

      <Pressable
        onPress={() => {setMostrarFormulario(false)}}
        style={styles.cancelButton}
      >
        <Text style={styles.buttonText}>Cancelar</Text>
      </Pressable>
    </View>
  );
};

export default App = () => {
  return (
    <SQLiteProvider databaseName='bancoToDo.db' onInit={iniciarBancoDeDados}>
      <View style={styles.container}>
        <Text style={styles.title}>ToDo List</Text>
        <Conteudo />
      </View>
    </SQLiteProvider>
  );
}


const Conteudo = () => {
  const db = useSQLiteContext();
  const [tarefas, setTarefas] = useState([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [tarefa, setTarefa] = useState({ id: 0, nome: '', descricao: ''});

  const getTarefas = async () => {
    try {
      const allRows = await db.getAllAsync('SELECT * FROM tarefa');
      setTarefas(allRows);
    } catch (error) {
      console.log('Erro ao ler os dados: ', error)
    }
  };

  const confirmarSalvar = () => {
    if (tarefa.nome.length === 0 || tarefa.descricao.length === 0) {
      Alert.alert('Atenção!', 'Por favor, entre com todos os dados!')
    } else {
      Alert.alert('Atenção!', 'Tarefa adicionada com sucesso!')
      adicionarTarefa(tarefa);
      setTarefa({nome: '', descricao: ''});
      setMostrarFormulario(false);
    }
  }

  const adicionarTarefa = async (novaTarefa) => {
    try {
      const query = await db.prepareAsync('INSERT INTO tarefa (nome, descricao, data_limite, categoria) VALUES (?, ?, ?, ?)');
      await query.executeAsync([novaTarefa.nome, novaTarefa.descricao, novaTarefa.data_limite, novaTarefa.categoria]);
      await getTarefas();
    } catch (error) {
      console.log('Erro ao adicionar tarefa', error);
    }
  };
  
  const atualizarTarefa = async (tarefaId, novaTarefaNome, novaTarefaDescricao, novaDataLimite, novaCategoria) => {
    try {
      await db.runAsync('UPDATE tarefa SET nome = ?, descricao = ?, data_limite = ?, categoria = ? WHERE id = ?', [novaTarefaNome, novaTarefaDescricao, novaDataLimite, novaCategoria, tarefaId]);
      Alert.alert('Atenção!', 'Tarefa atualizada com sucesso!');
      await getTarefas(); // Atualiza a lista de tarefas
    } catch (error) {
      console.log('Erro ao atualizar tarefa: ', error);
    }
  };
  

  const confirmarExcluirTodos = () => {
    Alert.alert(
      'Atenção', 
      'Deseja excluir todos as tarefas', 
      [
        { text: 'Não', onPress: () => { }, style: 'cancel' },
        { text: 'Sim', onPress: excluirTodasTarefas },
      ],
      { cancelable: true }
    );
  }

  
  
  const excluirTodasTarefas = async () => {
    try {
      await db.runAsync('DELETE FROM tarefa');
      await getTarefas();
    } catch (error) {
      console.log('Erro ao excluir: ', error);
    }
  };

  const excluirTarefa = async (id) => {
    try {
      await db.runAsync('DELETE FROM tarefa WHERE id= ?', [id]);
      await getTarefas();
    } catch (error) {
      console.log('Erro ao excluir: ', error);
    }
  }

  useEffect(() => {
    getTarefas();
  }, []);


  return (
    <View style={styles.contentContainer}>
      {tarefas.length === 0 ? (
        <Text>Não existem tarefas</Text>
      ) : (
        <FlatList 
          data={tarefas}
          renderItem={({item}) => (<TarefaBotao tarefa={item} excluirTarefa={excluirTarefa} atualizarTarefa={atualizarTarefa} />)}
          keyExtractor={(item) => item.id.toString()}
        />
      )}

      {mostrarFormulario && (<TarefaFormulario tarefa={tarefa} setTarefa={setTarefa} onSave={confirmarSalvar} setMostrarFormulario={setMostrarFormulario} />)}

      <View style={styles.iconsContent}>
        <AntDesign 
            name='pluscircleo'
            size={24}
            color='blue'
            onPress={() => setMostrarFormulario(true)}
            style={styles.icon}
          />
          
          <AntDesign 
            name='delete'
            size={24}
            color='red'
            onPress={confirmarExcluirTodos}
            style={styles.icon}
          />

      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginVertical: 60,
    marginBottom: 20,
  },

  contentContainer: {
    flex: 1,
    width: '90%',
  },
  usuarioBotao: {
    backgroundColor: 'lightblue',
    padding: 6,
    marginTop: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignContent: 'center'
  },
  usuarioTexto: {
    fontSize: 20, 
    fontWeight: '700',
  },
  usuarioConteudo: {
    backgroundColor: '#cdcdcd',
    padding: 10,
  }, 
  icon: {
    marginHorizontal: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 8,
    marginVertical: 4,
  },
  saveButton: {
    backgroundColor: 'blue',
    padding: 10,
    marginVertical: 4,
  },
  buttonText: {
    color:'white',
    textAlign:'center',
  },
  cancelButton: {
    backgroundColor:'grey',
    padding: 10,
    marginVertical: 5,
  },
  iconsContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 20,
  },
  actions: {
    flexDirection:'row',
    justifyContent: 'space-around',
    padding:10,
  },
});