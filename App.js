import { Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SQLiteProvider, useSQLiteContext } from 'expo-sqlite';
import { useState, useEffect } from 'react';
import { FontAwesome, Octicons, Entypo, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
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
      return <MaterialCommunityIcons name="school" size={35} color="gray" />;
    case 'Trabalhos Acadêmicos/Tarefas':
      return <MaterialCommunityIcons name="school" size={35} color="gray" />;
    case 'Exercícios':
      return <MaterialCommunityIcons name="dumbbell" size={35} color="gray" />;
    case 'Manutenção':
      return <MaterialCommunityIcons name="wrench" size={35} color="gray" />;
    case 'Lazer':
      return <MaterialCommunityIcons name="beach" size={35} color="gray" />;
    default:
      return <MaterialCommunityIcons name="help" size={35} color="gray" />;
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
      <Pressable style={styles.tarefaBotao} onPress={() => setTarefaSelecionada(tarefaSelecionada === tarefa.id ? null : tarefa.id)}>
        <View style={styles.box}>
          <Text style={styles.tarefaTexto}>{tarefa.id} - {formatarData(tarefa.data_limite)}</Text>
       
          {tarefaSelecionada === tarefa.id && (
            <View style={styles.actions}>
              <FontAwesome 
                name='edit'
                size={18}
                color='white'
                onPress={iniciarEdicao}
                style={styles.icon}
              />
              <Octicons 
                name='repo-deleted'
                size={18}
                color='white'
                onPress={confirmarExcluir}
                style={styles.icon}
              />
            </View>
          )}
          </View>
      </Pressable>
      

      {tarefaSelecionada === tarefa.id && !estaEditando && (
        
        <View style={styles.tarefaConteudo}>   
          <View style={styles.tarefaIconeCard}>
            {categoriaIcon(tarefa.categoria)} 
          </View>
          <View style={styles.tarefaIconeTexto}>
            <Text style={styles.textoCard}>Categoria: {tarefa.categoria}</Text>
            <Text style={styles.textoCard}>Descrição: {tarefa.descricao}</Text>
            <Text style={styles.textoCard}>Data Limite: {formatarData(tarefa.data_limite)}</Text>
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
    <View style={styles.formulario}> 
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
        <View style={styles.cabecalho}>
        <Text style={styles.titulo}>App ToDo List</Text>
        </View>        
        <Conteudo />
      </View>
    </SQLiteProvider>
  );
}


const Conteudo = () => {
  const db = useSQLiteContext();
  const [tarefas, setTarefas] = useState([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [tarefa, setTarefa] = useState({ id: 0, nome: '', descricao: '', categoria: '', data_limite:''});

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
      setTarefa({categoria: '', descricao: '', data_limite: '' });
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
          <View style={styles.inicioIcon}>
          <FontAwesome5 name='gamepad' size={35} color='white'/>
          <Text style={styles.textoInicio}>Não existem tarefas adicionadas</Text>
        </View>
      
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
            color='white'
            onPress={() => setMostrarFormulario(true)}
            style={styles.icon}
          />
          
          <Octicons 
            name='repo-deleted'
            size={24}
            color='white'
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
    backgroundColor: '#1a1f1e',
    marginTop: 20,    
    justifyContent: 'flex-start'
  },

  box:{
    height: 40,
    width: '100%',
    borderColor: '#93ccc6',
    borderWidth: 1,
    padding: 7,
    marginTop: 7,
    borderRadius: 10,
  },

  cabecalho: {
    width: '100%',
    height: 100,
    justifyContent: 'center',
  },

  titulo: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'center',
    color: 'white'
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

  inicioIcon: {
    alignItems: 'center',
    flexDirection: 'column'
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
    marginLeft: 15,
    // marginTop: 15,
    flex: 1,
    color: 'white',
  },

  actions: {
    flexDirection: 'row',
    justifyContent: 'center'
  },

  icon: {
    marginLeft: 10,
  },

  tarefaConteudo: {
    marginTop: 10,
    fontSize: 16,
    justifyContent: 'space-between',
    flexDirection: 'row',
  
  },

  tarefaIconeCard:{
    backgroundColor: 'white',
    borderTopStartRadius: 10,
    borderBottomLeftRadius: 10,
    width: 51,   
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
    backgroundColor: 'white',
    borderColor: '#176585',
    // justifyContent: 'space-between',
    borderWidth: 1, 
    shadowColor: '#000',
    padding: 5,
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
  },
 
  textoInicio: {
    color: 'white',
    fontSize: 15,
    // textAlign: 'center',
  },

  textoCard: {
    color: 'black',
    fontWeight: 'bold'
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
 
});
