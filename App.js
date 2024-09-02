import { Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SQLiteProvider, useSQLiteContext } from 'expo-sqlite';
import { useState, useEffect } from 'react';
import { FontAwesome, Octicons, Entypo, MaterialCommunityIcons } from '@expo/vector-icons';
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
const categoriaIcon = (categoria) => {
  switch (categoria) {
    case 'Nenhuma categoria selecionada.':
      return <MaterialCommunityIcons name="school" size={30} color="gray" />;
    case 'Trabalhos Acadêmicos/Tarefas':
      return <MaterialCommunityIcons name="school" size={30} color="gray" />;
    case 'Exercícios':
      return <MaterialCommunityIcons name="dumbbell" size={30} color="gray" />;
    case 'Manutenção':
      return <MaterialCommunityIcons name="wrench" size={30} color="gray" />;
    case 'Lazer':
      return <MaterialCommunityIcons name="beach" size={30} color="gray" />;
    default:
      return <MaterialCommunityIcons name="help" size={30} color="gray" />;
  }
};

const TarefaBotao = ({ tarefa, excluirTarefa, atualizarTarefa }) => {
  const [tarefaSelecionada, setTarefaSelecionada] = useState(null);
  const [estaEditando, setEstaEditando] = useState(false);
  const [tarefaEditada, setTarefaEditada] = useState({
    nome: tarefa.nome || '',
    descricao: tarefa.descricao || '',
    data_limite: tarefa.data_limite || '',
    categoria: tarefa.categoria || 'Nenhuma categoria selecionada.',
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
      categoria: tarefa.categoria || '',
      descricao: tarefa.descricao,
      data_limite: tarefa.data_limite || 'Nenhuma categoria selecionada.',
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
        <Text style={styles.tarefaTexto}>{tarefa.id} - {formatarData(tarefa.data_limite)}</Text>
        {tarefaSelecionada === tarefa.id && (
          <View style={styles.actions}>
            <FontAwesome 
              name='edit'
              size={18}
              color='red'
              onPress={iniciarEdicao}
              style={styles.icon}
            />
            <Octicons 
              name='repo-deleted'
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
          <View style={styles.tarefaIconeCard}>
            {categoriaIcon(tarefa.categoria)} 
          </View>
          <View style={styles.tarefaIconeTexto}>
            <Text>Categoria: {tarefa.categoria}</Text>
            <Text>Descrição: {tarefa.descricao}</Text>
            <Text>Data Limite: {formatarData(tarefa.data_limite)}</Text>
          </View>         
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

  const handleCategoriaChange = (itemValue) => {
    setTarefa({ ...tarefa, categoria: itemValue || 'Nenhuma categoria selecionada.' });
  };

  return (
    <View>
      <Picker selectedValue={tarefa.categoria} style={styles.picker} onValueChange={handleCategoriaChange}>
        <Picker.Item label="Selecione uma categoria." value= "Nenuma categoria selecionada."/>
        <Picker.Item label="Trabalhos Acadêmicos/Tarefas" value= "Trabalhos Acadêmicos/Tarefas"/>
        <Picker.Item label="Exercícios" value="Exercícios" />
        <Picker.Item label="Manutenção" value="Manutenção" />
        <Picker.Item label="Lazer" value="Lazer" />
      </Picker>

      <TextInput 
        style={styles.input}
        placeholder='Descrição'
        value={tarefa.descricao}
        onChangeText={(text) => setTarefa({...tarefa, descricao: text})}
        autoCapitalize='none'
      />
        <Pressable onPress={() => setShowPicker(true)} style={styles.datePickerButton}>
        <Text>{tarefa.data_limite ? `Data Limite: ${tarefa.data_limite}` : 'Escolher Data Limite'}</Text>
      </Pressable>
      {showPicker && (
        <DateTimePicker
          mode="date"
          value={new Date(tarefa.data_limite || new Date())}
          onChange={handleDateChange}
        />
      )} 
      <View style={styles.botoes}>
        <Pressable
          onPress={onSave}
          style={styles.botaoSalvar}
        >
          <Text style={styles.botaotexto}>Salvar</Text>
        </Pressable>

        <Pressable
          onPress={() => {setMostrarFormulario(false)}}
          style={styles.botaoCancelar}
        >
          <Text style={styles.botaotexto}>Cancelar</Text>
        </Pressable>
      </View>
      
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
    if (tarefa.descricao.length === 0) {
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
      await query.executeAsync([novaTarefa.nome, novaTarefa.descricao, novaTarefa.data_limite, novaTarefa.categoria || 'Nenhuma categoria selecionada.']);
      await getTarefas();
    } catch (error) {
      console.log('Erro ao adicionar tarefa', error);
    }
  };
  
  const atualizarTarefa = async (tarefaId, novaTarefaNome, novaTarefaDescricao, novaDataLimite, novaCategoria) => {
    try {
      await db.runAsync('UPDATE tarefa SET nome = ?, descricao = ?, data_limite = ?, categoria = ? WHERE id = ?', [novaTarefaNome, novaTarefaDescricao, novaDataLimite, novaCategoria, tarefaId]);
      Alert.alert('Atenção!', 'Tarefa atualizada com sucesso!');
      await getTarefas();
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
        <Entypo 
            name='add-to-list'
            size={24}
            color='blue'
            onPress={() => setMostrarFormulario(true)}
            style={styles.icon}
          />
          
          <Octicons 
            name='repo-deleted'
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
    padding: 15,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  tarefaBotao: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tarefaTexto: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
  },
  icon: {
    marginLeft: 10,
  },
  tarefaConteudo: {
    marginTop: 10,
    fontSize: 16,
    justifyContent: 'space-between',
    flexDirection: 'row',
    alignItems: ""
  },

  tarefaIconeCard:{
    backgroundColor: '#c2e4cb',
    borderRadius: 5,
    marginBottom: 15,
    width: 51,
    height: 51,
    padding: 10,
    borderColor: '#176585',
    alignItems: 'center',
    borderWidth: 1, 
    justifyContent: 'center', 
    shadowColor: '#000', 
    shadowOffset: { width: 5, height: 0}, 
    shadowOpacity: 0.2, 
    shadowRadius: 2, 
    elevation: 5,

  },

  tarefaIconeTexto: {
    width: 275,
    borderColor: '#176585',
    justifyContent: 'center',
    borderWidth: 1, 
    shadowColor: '#000',
    padding: 5,
    borderRadius: 5,
  },

  formulario: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  picker: {
    height: 50,
    width: '100%',
    marginBottom: 10,
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    marginBottom: 10,
    padding: 10,
  },
  datePickerButton: {
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    padding: 10,
    marginBottom: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  botoes: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  botaoSalvar: {
    backgroundColor: '#28a745',
    borderRadius: 5,
    padding: 10,
    width: '48%',
    alignItems: 'center',
  },
  
 botaoCancelar: {
    backgroundColor: '#dc3545',
    borderRadius: 5,
    padding: 10,
    width: '48%',
    alignItems: 'center',
  },
  botaotexto: {
    color: '#fff',
    fontWeight: 'bold',
  },
  iconsContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  noTasksText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 18,
    color: '#555',
  },
});
